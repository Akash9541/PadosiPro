import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}

const resendApiKey = process.env.RESEND_API_KEY || '';

if (isProduction && !resendApiKey) {
  throw new Error('RESEND_API_KEY must be set in production.');
}

if (isProduction && process.env.RESEND_FROM_EMAIL?.includes('onboarding@resend.dev')) {
  throw new Error('Set RESEND_FROM_EMAIL to an address on your verified sending domain in production.');
}

export const config: {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string | number;
  resendApiKey: string;
  resendFromEmail: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
} = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resendApiKey,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'PadosiPro <onboarding@resend.dev>',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
};
