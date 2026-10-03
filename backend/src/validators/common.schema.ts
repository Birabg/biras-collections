import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_NUMBER, MAX_PAGE_SIZE } from '../constants';

/*
 * Shared schema fragments.
 */

export const idParam = z.object({ id: z.string().uuid('Invalid identifier') });

export const slugParam = z.object({ slug: z.string().min(1).max(140) });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE_NUMBER).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(180);

/**
 * Ethiopia uses 9- or 10-digit local numbers, commonly written +2519XXXXXXXX or
 * 09XXXXXXXX. Accept both and normalise to +2519XXXXXXXX for storage.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?251[0-9]{9}$|^0[0-9]{9}$/, 'Enter a valid Ethiopian phone number')
  .transform((value) => normalisePhone(value));

export function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;

  return value;
}

/**
 * Identity helper.
 *
 * Zod object schemas strip unknown keys by default, which is the mass-assignment
 * defence (a posted `role` is dropped before it reaches a service). This exists so
 * that intent is explicit at the call site rather than implicit.
 */
export const stripUnknown = <T extends z.ZodRawShape>(schema: T): z.ZodObject<T> =>
  z.object(schema);

export const isoDateRange = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});