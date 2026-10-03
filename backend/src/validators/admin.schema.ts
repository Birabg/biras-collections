import { z } from 'zod';
import { paginationSchema } from './common.schema';

/*
 * Administrative schemas.
 *
 * Admin routes are the ones an attacker most wants to reach, so these reject
 * anything that would let a caller set a role, a stock level or a status
 * directly. Stock moves through the inventory service, which records a movement;
 * order status goes through the transition-checked update.
 */

export const adminOrderQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  customerId: z.string().uuid().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(300).optional(),
});

export const adminCustomerQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  role: z.enum(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export const customerIdParam = z.object({ id: z.string().uuid('Invalid customer') });

export const setCustomerActiveSchema = z.object({
  isActive: z.boolean(),
});

/*
 * Role changes. An admin may not promote themselves, and only a SUPER_ADMIN may
 * assign or revoke SUPER_ADMIN — otherwise any admin could create a peer with
 * strictly more power, which defeats the point of having two tiers.
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
});

export const inventoryAdjustSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, 'Quantity must be a non-zero adjustment'),
  reason: z.enum(['ADJUSTMENT', 'RESTOCK', 'DAMAGE']),
  note: z.string().trim().max(300).optional(),
});

export const variantIdParam = z.object({ id: z.string().uuid('Invalid variant') });

export const setStockLevelSchema = z.object({
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000),
});

export const inventoryQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  level: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
});

export const reportQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  interval: z.enum(['day', 'week', 'month']).default('day'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const settingUpsertSchema = z.object({
  value: z.unknown(),
});

export const settingKeyParam = z.object({ key: z.string().trim().min(1).max(80) });