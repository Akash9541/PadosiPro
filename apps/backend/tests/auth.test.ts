import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import bcrypt from 'bcrypt';
import { hashOTP } from '../src/utils/otp';

// These tests require a running PostgreSQL database
// Run with: npm test

beforeAll(async () => {
  // Clean up test data
  await prisma.userTask.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.userTask.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  beforeEach(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    expect(user).not.toBeNull();
    expect(user!.isEmailVerified).toBe(false);
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should reject mismatched passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'DifferentPassword',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('POST /api/auth/verify-otp', () => {
  const testEmail = 'verify@example.com';

  beforeEach(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user with a known OTP
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Password123', 10),
      },
    });

    const codeHash = await hashOTP('123456');
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
  });

  it('should verify a correct OTP', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '123456',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user!.isEmailVerified).toBe(true);
  });

  it('should reject incorrect OTP and increment attempts', async () => {
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '999999',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');

    const verification = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    expect(verification!.attempts).toBe(1);
  });

  it('should block after 5 incorrect attempts', async () => {
    // Set attempts to 5
    await prisma.emailVerification.updateMany({
      where: { user: { email: testEmail } },
      data: { attempts: 5 },
    });

    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_ATTEMPTS_EXCEEDED');
  });

  it('should reject expired OTP', async () => {
    // Set expiry to the past
    await prisma.emailVerification.updateMany({
      where: { user: { email: testEmail } },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OTP_EXPIRED');
  });

  it('should not allow reuse of a used OTP', async () => {
    // Verify first
    await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '123456',
    });

    // Try to use again
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      code: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });
});

describe('POST /api/auth/login', () => {
  const testEmail = 'login@example.com';

  beforeEach(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should login a verified user', async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Password123', 10),
        isEmailVerified: true,
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject incorrect password', async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Password123', 10),
        isEmailVerified: true,
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject unverified user', async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Password123', 10),
        isEmailVerified: false,
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'Password123',
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });
});

describe('POST /api/auth/resend-otp', () => {
  const testEmail = 'resend@example.com';

  beforeEach(async () => {
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await bcrypt.hash('Password123', 10),
      },
    });

    // Create an old verification (sent 60 seconds ago, past cooldown)
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash: await hashOTP('111111'),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(Date.now() - 60 * 1000),
      },
    });
  });

  it('should resend OTP after cooldown period', async () => {
    const res = await request(app).post('/api/auth/resend-otp').send({
      email: testEmail,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject resend within cooldown period', async () => {
    // Update lastSentAt to now
    await prisma.emailVerification.updateMany({
      where: { user: { email: testEmail } },
      data: { lastSentAt: new Date() },
    });

    const res = await request(app).post('/api/auth/resend-otp').send({
      email: testEmail,
    });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('OTP_COOLDOWN');
  });
});
