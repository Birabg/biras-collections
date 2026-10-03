import { z } from 'zod';
import { phoneSchema } from './common.schema';
import { MAX_PAGE_NUMBER, MAX_QUANTITY_PER_LINE, MAX_CART_ITEMS } from '../constants';

/* ------------------------------------------------------------------- cart --*/

export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product'),
  variantId: z.string().uuid('Invalid variant').nullish(),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_LINE).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_LINE),
});

export const cartItemIdParam = z.object({ id: z.string().uuid('Invalid cart item') });

export const moveToCartSchema = addToCartSchema;

export const MAX_LINES = MAX_CART_ITEMS;

/* --------------------------------------------------------------- wishlist --*/

export const wishlistSchema = z.object({
  productId: z.string().uuid('Invalid product'),
});

/* --------------------------------------------------------------- addresses --*/

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  phone: phoneSchema,
  region: z.string().trim().min(2, 'Region is required').max(80),
  city: z.string().trim().min(2, 'City is required').max(80),
  subCity: z.string().trim().min(2, 'Sub-city is required').max(80),
  kebele: z.string().trim().max(80).nullish(),
  streetAddress: z.string().trim().min(3, 'Street address is required').max(200),
  additionalInfo: z.string().trim().max(300).nullish(),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export const addressIdParam = z.object({ id: z.string().uuid('Invalid address') });

/* ---------------------------------------------------------------- checkout --*/

/**
 * The checkout payload carries only what a customer genuinely decides: who to
 * contact, where to deliver, and how to pay. There is deliberately no field for
 * a total, subtotal, discount or payment status — the server derives all of it.
 */
export const createOrderSchema = z.object({
  shippingAddress: addressSchema.omit({ isDefault: true }),
  /**
   * `DEV` is the simulated gateway. It exists so a card checkout can be
   * exercised end-to-end locally, and `paymentService` refuses it outright when
   * NODE_ENV=production, so it cannot be used to take a real payment.
   */
  paymentMethod: z.enum(['TELEBIRR', 'CBE_BIRR', 'CHAPA', 'CASH_ON_DELIVERY', 'DEV']),
  customerNote: z.string().trim().max(500).nullish(),
  /** Optional saved address to copy from. Ownership is still verified. */
  addressId: z.string().uuid().nullish(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/* ----------------------------------------------------------------- orders --*/

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(MAX_PAGE_NUMBER).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().max(40).optional(),
});

export const orderIdParam = z.object({ id: z.string().uuid('Invalid order') });
export const orderNumberParam = z.object({ id: z.string().min(3).max(60) });