import { z } from 'zod';
import { paginationSchema } from './common.schema';

/*
 * Catalogue query schemas.
 *
 * `sort` is an allowlist rather than a passed-through string, because a
 * Prisma orderBy built from raw user input is an injection surface.
 */

export const PRODUCT_SORTS = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  'price-asc': { price: 'asc' },
  'price-desc': { price: 'desc' },
  'name-asc': { name: 'asc' },
  'name-desc': { name: 'desc' },
  rating: { rating: 'desc' },
} as const;

export const productSortSchema = z
  .enum(Object.keys(PRODUCT_SORTS) as [string, ...string[]])
  .default('newest');

export const productQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).max(10_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(10_000_000).optional(),
  sort: productSortSchema,
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  isNew: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  bestSeller: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  inStock: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(40).optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

/* ------------------------------------------------------------ write schemas --*/

const variantSchema = z.object({
  sku: z.string().trim().min(2).max(60),
  size: z.string().trim().max(20).nullish(),
  color: z.string().trim().max(40).nullish(),
  colorHex: z
    .string()
    .trim()
    .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Colour must be a hex value')
    .nullish(),
  price: z.coerce.number().min(0).max(10_000_000).nullish(),
  compareAtPrice: z.coerce.number().min(0).max(10_000_000).nullish(),
  stockQuantity: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).max(100_000).default(5),
  isActive: z.boolean().default(true),
});

const imageSchema = z.object({
  url: z.string().trim().url('Image must be a valid URL').max(500),
  altText: z.string().trim().max(160).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens'),
  sku: z.string().trim().min(2).max(60),
  description: z.string().trim().min(1).max(10_000),
  shortDescription: z.string().trim().max(300).nullish(),
  price: z.coerce.number().min(0).max(10_000_000),
  compareAtPrice: z.coerce.number().min(0).max(10_000_000).nullish(),
  categoryId: z.string().uuid('Select a valid category'),
  subcategory: z.string().trim().max(60).nullish(),
  badge: z.string().trim().max(40).nullish(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).max(1_000_000).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  images: z.array(imageSchema).max(12).default([]),
  variants: z.array(variantSchema).max(200).default([]),
});

/*
 * Partial update.
 *
 * This is written out rather than derived with `createProductSchema.partial()`,
 * and that is deliberate. In this Zod version `.partial()` (and `.optional()`)
 * applied to a field carrying a `.default()` still fills that default in, so a
 * derived schema turned
 *
 *     PATCH { price: 4500 }
 *
 * into
 *
 *     PATCH { price: 4500, rating: 0, reviewCount: 0, isActive: true,
 *             isFeatured: false, isNew: false, isBestSeller: false,
 *             images: [], variants: [] }
 *
 * which reset the review score, republished disabled products, cleared every
 * image and retired every variant. Worse, `PATCH {}` passed validation, so an
 * empty body was silently accepted as "reset the product to defaults".
 *
 * The fields below therefore carry no defaults: absent means absent, and the
 * service's `data.x !== undefined` guards leave untouched columns alone.
 */
const updateProductShape = {
  name: createProductSchema.shape.name,
  slug: createProductSchema.shape.slug,
  sku: createProductSchema.shape.sku,
  description: createProductSchema.shape.description,
  shortDescription: createProductSchema.shape.shortDescription,
  price: createProductSchema.shape.price,
  compareAtPrice: createProductSchema.shape.compareAtPrice,
  categoryId: createProductSchema.shape.categoryId,
  subcategory: createProductSchema.shape.subcategory,
  badge: createProductSchema.shape.badge,
  rating: createProductSchema.shape.rating.unwrap(),
  reviewCount: createProductSchema.shape.reviewCount.unwrap(),
  isActive: createProductSchema.shape.isActive.unwrap(),
  isFeatured: createProductSchema.shape.isFeatured.unwrap(),
  isNew: createProductSchema.shape.isNew.unwrap(),
  isBestSeller: createProductSchema.shape.isBestSeller.unwrap(),

  // Image and variant defaults live on the inner object schemas, and the service
  // treats "key absent" differently from "key present and empty" — so the inner
  // objects are partial too. `sku` stays required: it is the key the service
  // reconciles variants by, so a variant without one cannot be matched to a row.
  images: z
    .array(
      z.object({
        url: imageSchema.shape.url,
        altText: imageSchema.shape.altText,
        sortOrder: imageSchema.shape.sortOrder.unwrap().optional(),
      }),
    )
    .max(12),
  variants: z
    .array(
      z.object({
        ...variantSchema.shape,
        stockQuantity: variantSchema.shape.stockQuantity.unwrap().optional(),
        lowStockThreshold: variantSchema.shape.lowStockThreshold.unwrap().optional(),
        isActive: variantSchema.shape.isActive.unwrap().optional(),
      }),
    )
    .max(200),
};

export const updateProductSchema = z
  .object(updateProductShape)
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

export const setProductFlagsSchema = z
  .object({
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.isFeatured !== undefined || value.isActive !== undefined, {
    message: 'Provide isFeatured or isActive',
  });

export const productIdParam = z.object({ id: z.string().uuid('Invalid product identifier') });

/* -------------------------------------------------------------- categories --*/

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens'),
  description: z.string().trim().max(400).nullish(),
  image: z.string().trim().url().max(500).nullish(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/*
 * Partial category update.
 *
 * Written out for the same reason as `updateProductSchema`: `.partial()` on a
 * field with a `.default()` keeps the default, so a rename was also a silent
 * republish (`isActive: true`) and a silent move to the front of the storefront
 * ordering (`sortOrder: 0`).
 */
export const updateCategorySchema = z
  .object({
    name: createCategorySchema.shape.name,
    slug: createCategorySchema.shape.slug,
    description: createCategorySchema.shape.description,
    image: createCategorySchema.shape.image,
    isActive: createCategorySchema.shape.isActive.unwrap(),
    sortOrder: createCategorySchema.shape.sortOrder.unwrap(),
  })
  .partial();

export const categoryIdParam = z.object({ id: z.string().uuid('Invalid category identifier') });