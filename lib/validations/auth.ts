import { z } from 'zod';

import { usernameSchema } from '@/lib/auth/username';

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your username or email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be 50 characters or less'),
    username: usernameSchema,
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = resetPasswordSchema;

export const deleteAccountSchema = z
  .object({
    confirmation: z.string().trim(),
  })
  .refine((data) => data.confirmation === 'DELETE', {
    message: 'Type DELETE to confirm',
    path: ['confirmation'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
