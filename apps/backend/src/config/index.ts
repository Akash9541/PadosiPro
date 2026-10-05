import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}

if (isProduction && !process.env.SMTP_HOST) {
  throw new Error('SMTP_HOST must be set in production.');
}

export const config: {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string | number;
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
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
};
