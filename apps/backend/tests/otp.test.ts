import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOTP, hashOTP, compareOTP } from '../src/utils/otp';

describe('OTP Utils', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit string', () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs', () => {
      const otps = new Set(Array.from({ length: 10 }, () => generateOTP()));
      // At least some should be different (statistically near-certain)
      expect(otps.size).toBeGreaterThan(1);
    });
  });

  describe('hashOTP and compareOTP', () => {
    it('should hash and verify a correct OTP', async () => {
      const otp = '123456';
      const hash = await hashOTP(otp);
      expect(hash).not.toBe(otp);
      expect(await compareOTP(otp, hash)).toBe(true);
    });

    it('should reject an incorrect OTP', async () => {
      const hash = await hashOTP('123456');
      expect(await compareOTP('654321', hash)).toBe(false);
    });
  });
});
