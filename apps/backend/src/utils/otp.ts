import crypto from 'crypto';
import bcrypt from 'bcrypt';

export function generateOTP(): string {
  // Generate a random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function compareOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
