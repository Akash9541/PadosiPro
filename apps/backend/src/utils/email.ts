import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: config.smtp.user
    ? { user: config.smtp.user, pass: config.smtp.password }
    : undefined,
});

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a;">Verify your email</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #7C3AED; letter-spacing: 8px; font-size: 32px;">${otp}</h1>
        <p style="color: #666;">This code expires in 10 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;

  if (resend) {
    const { error } = await resend.emails.send({
      from: config.resendFromEmail,
      to: [email],
      subject: 'Your PadosiPro Verification Code',
      html,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw new Error(error.message);
    }

    return;
  }

  await transporter.sendMail({
    from: '"PadosiPro" <noreply@padosipro.com>',
    to: email,
    subject: 'Your PadosiPro Verification Code',
    html,
  });
}
