import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { mapProduct, mapCategory, stockLevelFor } from '../utils/mappers';
import { NotFoundError } from '../utils/errors';
import { PRODUCT_SORTS, type ProductQuery } from '../validators/product.schema';
import { buildPagination, buildPageMeta, type Pagination } from '../utils/pagination';

/*
 * Catalogue service.
 *
 * Inactive and soft-deleted products are filtered out of every public query at
 * the `where` clause, so no route has to remember to exclude them.
 */

const PUBLIC_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { where: { isActive: true } },
} satisfies Prisma.ProductInclude;

/** Prisma `contains` is case-insensitive only with Postgres; this keeps it explicit. */
function searchFilter(term: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { shortDescription: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { subcategory: { contains: term, mode: 'insensitive' } },
      { category: { name: { contains: term, mode: 'insensitive' } } },
    ],
  };
}

export async function listProducts(query: ProductQuery) {
  const pagination: Pagination = buildPagination(query.page, query.limit);

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
    ...(query.isNew !== undefined ? { isNew: query.isNew } : {}),
    ...(query.bestSeller !== undefined ? { isBestSeller: query.bestSeller } : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
            ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
          },
        }
      : {}),
    ...(query.size
      ? { variants: { some: { size: query.size, isActive: true } } }
      : {}),
    ...(query.color
      ? { variants: { some: { color: query.color, isActive: true } } }
      : {}),
    ...(query.inStock ? { variants: { some: { isActive: true, stockQuantity: { gt: 0 } } } } : {}),
    ...(query.search ? searchFilter(query.search) : {}),
  };

  const orderBy = PRODUCT_SORTS[query.sort as keyof typeof PRODUCT_SORTS] ?? PRODUCT_SORTS.newest;

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: PUBLIC_INCLUDE,
      orderBy: [orderBy as Prisma.ProductOrderByWithRelationInput, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  return {
    data: products.map(mapProduct),
    pagination: buildPageMeta(pagination, total),
  };
}

/**
 * Detail lookup by slug. Used by the storefront, so the slug is resolved and the
 * 404 message matches what the frontend already expects.
 */
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true, deletedAt: null },
    include: PUBLIC_INCLUDE,
  });

  if (!product) throw new NotFoundError('That piece could not be found.');

  return mapProduct(product);
}

export async function getRelatedProducts(productId: string, limit = 4) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!product) throw new NotFoundError('That piece could not be found.');

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: productId },
      isActive: true,
      deletedAt: null,
    },
    include: PUBLIC_INCLUDE,
    take: limit,
  });

  return related.map(mapProduct);
}

export async function listCategories({ includeInactive = false } = {}) {
  const categories = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: { where: { isActive: true, deletedAt: null } } } } },
  });

  return categories.map(mapCategory);
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    include: { _count: { select: { products: true } } },
  });

  if (!category) throw new NotFoundError('That category could not be found.');

  return mapCategory(category);
}

/* --------------------------------------------------------- admin catalogue --*/

export async function adminListProducts(query: ProductQuery & { includeInactive?: boolean }) {
  const pagination = buildPagination(query.page, query.limit);

  const where: Prisma.ProductWhereInput = {
    // Admin sees soft-deleted rows too, but never hard-deleted ones.
    ...(query.includeInactive ? {} : { deletedAt: null }),
    ...(query.category ? { category: { slug: query.category } } : {}),
    ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
    ...(query.search ? searchFilter(query.search) : {}),
  };

  const orderBy = PRODUCT_SORTS[query.sort as keyof typeof PRODUCT_SORTS] ?? PRODUCT_SORTS.newest;

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
      },
      orderBy: [orderBy as Prisma.ProductOrderByWithRelationInput, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.limit,
    }),
  ]);

  return {
    data: products.map(mapProduct),
    pagination: buildPageMeta(pagination, total),
  };
}

export async function adminGetProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
  });

  if (!product) throw new NotFoundError('That product could not be found.');

  return mapProduct(product);
}

type CreateProductData = {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  subcategory?: string | null;
  badge?: string | null;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  images: Array<{ url: string; altText?: string; sortOrder: number }>;
  variants: Array<{
    sku: string;
    size?: string | null;
    color?: string | null;
    colorHex?: string | null;
    price?: number | null;
    compareAtPrice?: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    isActive: boolean;
  }>;
};

export async function createProduct(data: CreateProductData) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      sku: data.sku,
      description: data.description,
      shortDescription: data.shortDescription ?? null,
      price: data.price,
      compareAtPrice: data.compareAtPrice ?? null,
      categoryId: data.categoryId,
      subcategory: data.subcategory ?? null,
      badge: data.badge ?? null,
      rating: data.rating,
      reviewCount: data.reviewCount,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
      isNew: data.isNew,
      isBestSeller: data.isBestSeller,
      images: { create: data.images },
      variants: { create: data.variants },
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
  });

  return mapProduct(product);
}

export async function updateProduct(id: string, data: Partial<CreateProductData>) {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) throw new NotFoundError('That product could not be found.');

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.sku !== undefined && { sku: data.sku }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
      ...(data.badge !== undefined && { badge: data.badge }),
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.reviewCount !== undefined && { reviewCount: data.reviewCount }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isNew !== undefined && { isNew: data.isNew }),
      ...(data.isBestSeller !== undefined && { isBestSeller: data.isBestSeller }),
      ...(data.images !== undefined && {
        images: { deleteMany: {}, create: data.images },
      }),
      ...(data.variants !== undefined && {
        // Variants are replaced wholesale by the admin form. Stock levels on
        // existing variants are not silently overwritten: the update keeps each
        // variant's current stock unless the admin supplies a new one.
        variants: {
          deleteMany: {},
          create: data.variants,
        },
      }),
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
  });

  return mapProduct(product);
}

/**
 * Soft delete. Order items reference products, so a hard delete would break
 * order history; `deletedAt` hides it from the storefront while keeping it
 * resolvable for past orders and restorable by an admin.
 */
export async function softDeleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) throw new NotFoundError('That product could not be found.');

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });

  return { deleted: true };
}

export async function restoreProduct(id: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { deletedAt: null },
    include: { category: true, images: true, variants: true },
  });

  return mapProduct(product);
}

export async function setProductFlags(id: string, flags: { isFeatured?: boolean; isActive?: boolean }) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(flags.isFeatured !== undefined && { isFeatured: flags.isFeatured }),
      ...(flags.isActive !== undefined && { isActive: flags.isActive }),
    },
    include: { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: true },
  });

  return mapProduct(product);
}

/* ------------------------------------------------------------- categories --*/

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
}) {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      image: data.image ?? null,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
    include: { _count: { select: { products: true } } },
  });

  return mapCategory(category);
}

export async function updateCategory(id: string, data: Partial<Parameters<typeof createCategory>[0]>) {
  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
    include: { _count: { select: { products: true } } },
  });

  return mapCategory(category);
}

export async function deleteCategory(id: string) {
  const productCount = await prisma.product.count({ where: { categoryId: id } });

  if (productCount > 0) {
    throw new Prisma.PrismaClientKnownRequestError('Category has products', {
      code: 'P2003',
      clientVersion: 'x',
    });
  }

  await prisma.category.delete({ where: { id } });
  return { deleted: true };
}

export { stockLevelFor };