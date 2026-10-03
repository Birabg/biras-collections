import { prisma } from '../config/prisma';
import { NotFoundError, ConflictError } from '../utils/errors';
import { mapProduct } from '../utils/mappers';

/*
 * Wishlist service.
 *
 * Every query is scoped by `userId`. There is no "get wishlist by id" path, so
 * a customer can only ever read their own list.
 */

export async function getWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { isActive: true } },
        },
      },
    },
  });

  // A product deleted from the catalogue stays in the wishlist row but has
  // nothing to render, so it is filtered out rather than crashing the page.
  const products = items
    .filter((item) => item.product.isActive && item.product.deletedAt === null)
    .map((item) => ({ productId: item.productId, savedAt: item.createdAt.toISOString(), ...mapProduct(item.product) }));

  return {
    items: products,
    itemCount: products.length,
    // Flat shape the frontend already reads.
    products: products.map(({ savedAt: _savedAt, productId: _productId, ...rest }) => rest),
  };
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, deletedAt: null },
    select: { id: true },
  });

  if (!product) throw new NotFoundError('That piece is no longer available.');

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) throw new ConflictError('That piece is already in your saved list.');

  await prisma.wishlistItem.create({ data: { userId, productId } });

  return getWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!existing) throw new NotFoundError('That piece is not in your saved list.');

  await prisma.wishlistItem.delete({ where: { id: existing.id } });

  return getWishlist(userId);
}

/** Idempotent toggle, which is what a heart button needs. */
export async function toggleWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) return { added: false, wishlist: await removeFromWishlist(userId, productId) };

  return { added: true, wishlist: await addToWishlist(userId, productId) };
}

export async function isInWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  return { isInWishlist: Boolean(existing) };
}

export async function clearWishlist(userId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId } });
  return getWishlist(userId);
}