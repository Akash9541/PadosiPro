import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/db';
import { config } from '../config';
import { registerSchema, loginSchema, verifyOTPSchema, resendOTPSchema } from '../validators';
import { generateOTP, hashOTP, compareOTP } from '../utils/otp';
import { sendOTPEmail } from '../utils/email';

export async function register(req: Request, res: Response) {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: result.error.errors[0].message,
        },
      });
    }

    const { email, password } = result.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' },
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash },
    });

    // Generate and send OTP
    const otp = generateOTP();
    const codeHash = await hashOTP(otp);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(),
      },
    });

    await sendOTPEmail(email, otp);

    return res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for the verification code.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}

export async function verifyOTP(req: Request, res: Response) {
  try {
    const result = verifyOTPSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: result.error.errors[0].message },
      });
    }

    const { email, code } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    // Get the latest unused verification code
    const verification = await prisma.emailVerification.findFirst({
      where: { userId: user.id, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'No verification code found. Please request a new one.' },
      });
    }

    if (verification.used) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'This verification code has already been used.' },
      });
    }

    // Check attempts
    if (verification.attempts >= 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Please request a new code.' },
      });
    }

    // Check expiry
    if (new Date() > verification.expiresAt) {
      return res.status(400).json({
        success: false,
        error: { code: 'OTP_EXPIRED', message: 'Verification code has expired. Please request a new one.' },
      });
    }

    // Compare OTP
    const isValid = await compareOTP(code, verification.codeHash);
    if (!isValid) {
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: verification.attempts + 1 },
      });

      const remaining = 4 - verification.attempts;
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Too many incorrect attempts. Please request a new code.',
        },
      });
    }

    // Mark OTP as used and verify user
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    return res.json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}

export async function resendOTP(req: Request, res: Response) {
  try {
    const result = resendOTPSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: result.error.errors[0].message },
      });
    }

    const { email } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email is already verified.' },
      });
    }

    // Check cooldown - last OTP sent within 30 seconds
    const lastVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { lastSentAt: 'desc' },
    });

    if (lastVerification) {
      const timeSinceLastSend = Date.now() - lastVerification.lastSentAt.getTime();
      const cooldownMs = 30 * 1000;
      if (timeSinceLastSend < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastSend) / 1000);
        return res.status(429).json({
          success: false,
          error: {
            code: 'OTP_COOLDOWN',
            message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
          },
        });
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const codeHash = await hashOTP(otp);

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(),
      },
    });

    await sendOTPEmail(email, otp);

    return res.json({
      success: true,
      message: 'Verification code sent.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: result.error.errors[0].message },
      });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' },
      });
    }

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          profileCompleted: user.profileCompleted,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong. Please try again.' },
    });
  }
}
