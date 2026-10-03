import { Prisma } from '@prisma/client';
import { toNumber, round2 } from './http';
import { STOCK_LEVEL, type StockLevel } from '../constants';

/*
 * Mappers: Prisma rows -> API response shapes.
 *
 * This is the only layer that knows about Decimal internals, so no route or
 * controller leaks a Prisma type. Two rules hold throughout:
 *   1. `passwordHash`, `tokenHash` and internal ids are never selected here.
 *   2. Money is always converted to a number the frontend can render directly.
 */

export function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    phone: user.phone ?? null,
    role: user.role,
    roleLabel: user.role.charAt(0) + user.role.slice(1).toLowerCase(),
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

type ProductRow = Prisma.ProductGetPayload<{
  include: { category: true; images: true; variants: true };
}>;

export function stockLevelFor(
  variants: { stockQuantity: number; lowStockThreshold: number; isActive?: boolean }[],
): StockLevel {
  const active = variants.filter((variant) => variant.isActive !== false);
  if (active.length === 0) return STOCK_LEVEL.OUT_OF_STOCK;

  const total = active.reduce((sum, variant) => sum + variant.stockQuantity, 0);
  if (total <= 0) return STOCK_LEVEL.OUT_OF_STOCK;

  const low = active.some(
    (variant) => variant.stockQuantity <= variant.lowStockThreshold && variant.stockQuantity > 0,
  );

  if (total <= active.reduce((sum, v) => sum + v.lowStockThreshold, 0) || low) {
    return STOCK_LEVEL.LOW_STOCK;
  }

  return STOCK_LEVEL.IN_STOCK;
}

export function mapVariant(variant: {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: Prisma.Decimal | null;
  compareAtPrice: Prisma.Decimal | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}) {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    colorHex: variant.colorHex,
    price: variant.price === null ? null : toNumber(variant.price),
    compareAtPrice: variant.compareAtPrice === null ? null : toNumber(variant.compareAtPrice),
    stockQuantity: variant.stockQuantity,
    lowStockThreshold: variant.lowStockThreshold,
    isActive: variant.isActive,
    isInStock: variant.stockQuantity > 0,
  };
}

export function mapProduct(product: ProductRow) {
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const variants = product.variants.filter((variant) => variant.isActive);

  const totalStock = variants.reduce((sum, variant) => sum + variant.stockQuantity, 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription,
    price: toNumber(product.price),
    compareAtPrice:
      product.compareAtPrice === null ? null : toNumber(product.compareAtPrice),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    subcategory: product.subcategory,
    badge: product.badge,
    rating: toNumber(product.rating),
    reviewCount: product.reviewCount,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,

    // Shape mirrors the frontend's hardcoded product objects so components
    // (ProductCard, Product, Cart) need no changes.
    images: images.map((image) => image.url),
    image: images[0]?.url ?? null,
    sizes: [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))],
    colors: [
      ...new Map(
        variants
          .filter((variant) => variant.color)
          .map((variant) => [
            variant.color as string,
            { name: variant.color as string, hex: variant.colorHex ?? '#cccccc' },
          ]),
      ).values(),
    ],
    variants: variants.map(mapVariant),

    stock: totalStock,
    stockLevel: stockLevelFor(variants),
    inStock: totalStock > 0,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function mapCategory(category: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    productCount: category._count?.products,
  };
}

export function mapAddress(address: {
  id: string;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  subCity: string;
  kebele: string | null;
  streetAddress: string;
  additionalInfo: string | null;
  isDefault: boolean;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: address.id,
    fullName: address.fullName,
    phone: address.phone,
    region: address.region,
    city: address.city,
    subCity: address.subCity,
    kebele: address.kebele,
    streetAddress: address.streetAddress,
    additionalInfo: address.additionalInfo,
    isDefault: address.isDefault,
    type: address.type,
    createdAt: address.createdAt.toISOString(),
    updatedAt: address.updatedAt.toISOString(),
  };
}

/**
 * The order shape every caller uses: items and payment always, and the customer
 * only when the caller selected it. `user` is deliberately a narrow projection —
 * services never include the full User row, and the mapper must not require one.
 */
type OrderRow = Prisma.OrderGetPayload<{
  include: { items: true; payment: true; user: { select: { id: true; firstName: true; lastName: true; email: true } } };
}>;

export function mapOrderItem(item: {
  id: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  slugSnapshot: string;
  imageSnapshot: string | null;
  variantSnapshot: Prisma.JsonValue | null;
  price: Prisma.Decimal;
  quantity: number;
  subtotal: Prisma.Decimal;
}) {
  const variant = (item.variantSnapshot ?? null) as { size?: string; color?: string } | null;

  return {
    id: item.id,
    productId: item.productId,
    name: item.productNameSnapshot,
    productName: item.productNameSnapshot,
    slug: item.slugSnapshot,
    sku: item.skuSnapshot,
    image: item.imageSnapshot,
    size: variant?.size ?? null,
    color: variant?.color ?? null,
    selectedSize: variant?.size ?? null,
    selectedColor: variant?.color ?? null,
    price: toNumber(item.price),
    quantity: item.quantity,
    subtotal: toNumber(item.subtotal),
  };
}

export function mapOrder(order: OrderRow, includeCustomer = false) {
  const items = order.items.map(mapOrderItem);

  const shipping = (order.shippingAddressSnapshot ?? {}) as Record<string, unknown>;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shippingFee),
    delivery: toNumber(order.shippingFee),
    discount: toNumber(order.discount),
    total: toNumber(order.total),
    tax: 0,

    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),

    shippingAddress: {
      fullName: (shipping.fullName as string) ?? null,
      name: (shipping.fullName as string) ?? null,
      phone: (shipping.phone as string) ?? null,
      region: (shipping.region as string) ?? null,
      city: (shipping.city as string) ?? null,
      subCity: (shipping.subCity as string) ?? null,
      kebele: (shipping.kebele as string) ?? null,
      streetAddress: (shipping.streetAddress as string) ?? null,
      additionalInfo: (shipping.additionalInfo as string) ?? null,
    },
    // Legacy shape the frontend already reads.
    shipping: {
      name: (shipping.fullName as string) ?? null,
      phone: (shipping.phone as string) ?? null,
      address: [shipping.streetAddress, shipping.kebele].filter(Boolean).join(', '),
      city: (shipping.city as string) ?? null,
      region: (shipping.region as string) ?? null,
    },

    customerNote: order.customerNote,
    trackingNumber: null,

    payment: order.payment
      ? {
          id: order.payment.id,
          provider: order.payment.provider,
          method: order.payment.method,
          status: order.payment.status,
          amount: toNumber(order.payment.amount),
          reference: order.payment.reference,
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,

    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    placedAt: order.createdAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),

    ...(includeCustomer && order.user
      ? {
          customer: {
            id: order.user.id,
            name: `${order.user.firstName} ${order.user.lastName}`.trim(),
            email: order.user.email,
          },
        }
      : {}),
  };
}

export function mapCart(cart: {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    quantity: number;
    priceSnapshot: Prisma.Decimal;
    product: ProductRow;
  }>;
}) {
  const items = cart.items.map((item) => {
    const variant = item.product.variants.find((v) => v.id === item.variantId);
    const image = [...item.product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

    // Authoritative price: variant override, else the product price. The
    // snapshot is used only when the product row is missing (deleted product).
    const price = variant?.price ?? item.product.price;
    const compareAtPrice = variant?.compareAtPrice ?? item.product.compareAtPrice;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      slug: item.product.slug,
      name: item.product.name,
      price: toNumber(price),
      compareAtPrice: compareAtPrice === null || compareAtPrice === undefined ? null : toNumber(compareAtPrice),
      image: image?.url ?? null,
      quantity: item.quantity,
      selectedSize: variant?.size ?? null,
      selectedColor: variant?.color ?? null,
      inStock: variant ? variant.stockQuantity >= item.quantity : item.product.isActive,
      stockQuantity: variant?.stockQuantity ?? 0,
      lineTotal: round2(toNumber(price) * item.quantity),
    };
  });

  const subtotal = round2(items.reduce((sum, item) => sum + item.lineTotal, 0));

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
  };
}