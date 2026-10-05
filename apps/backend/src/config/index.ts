import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set in production.');
}

const smtp = {
  host: process.env.SMTP_HOST || '',
  port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
};

if (isProduction && (!smtp.host || !process.env.SMTP_PORT || !smtp.user || !smtp.password)) {
  throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD must be set in production.');
}

if (!Number.isInteger(smtp.port) || smtp.port < 1 || smtp.port > 65535) {
  throw new Error('SMTP_PORT must be a valid port number.');
}

if (isProduction && smtp.port !== 587) {
  throw new Error('SMTP_PORT must be 587 in production to use STARTTLS.');
}

export const config: {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string | number;
  smtp: typeof smtp;
} = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  smtp,
};
