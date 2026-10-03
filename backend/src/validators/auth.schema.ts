import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './common.schema';

/*
 * Auth request schemas.
 *
 * Every schema is a plain `z.object`, which strips unknown keys by default. That
 * stripping is a security control, not a convenience: it is what stops a
 * registration request carrying `{"role":"ADMIN"}` from reaching the service
 * layer. See the `role`-less insert in auth.service.ts.
 */

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  phone: phoneSchema.optional(),
  acceptedTerms: z.literal(true, {
    error: 'You must accept the terms to create an account',
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: phoneSchema.nullable().optional(),
});

export const changeEmailSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, 'Current password is required'),
});

/** Placeholder while transactional email is not wired up. */
export const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Verification token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;