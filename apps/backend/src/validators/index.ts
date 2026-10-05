import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

export const resendOTPSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobileNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  address: z.string().min(1, 'Address is required'),
  businessName: z.string().optional().default(''),
});

export const taskSelectionSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, 'Please select at least one task'),
});
