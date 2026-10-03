/*
 * Database seed.
 *
 * Idempotent: every write is an upsert keyed on a natural identifier (slug, sku,
 * email), so `npm run prisma:seed` can be run repeatedly without duplicating rows.
 * That matters because the migration is the thing you re-create, not the seed.
 *
 * Safety:
 * - Refuses to run when NODE_ENV=production.
 * - Every account password comes from the environment. There are no built-in
 *   defaults, so an accidentally seeded deployment cannot have a known password.
 *   Accounts with a missing password are skipped and reported rather than created
 *   with something guessable.
 *
 * Usage:
 *   Copy .env.example to .env, fill in the SEED_*_PASSWORD values, then:
 *     npm run prisma:seed
 */

import { PrismaClient, type Prisma, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedCategories, seedProducts, seedSettings } from './catalogue.seed';
import type { SeedProduct, SeedColour } from './catalogue.seed';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 12);

interface SeedUserSpec {
  envEmail: string;
  envPassword: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

const seedUsers: SeedUserSpec[] = [
  {
    envEmail: 'SEED_SUPER_ADMIN_EMAIL',
    envPassword: 'SEED_SUPER_ADMIN_PASSWORD',
    email: 'superadmin@biras.demo',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
  },
  {
    envEmail: 'SEED_ADMIN_EMAIL',
    envPassword: 'SEED_ADMIN_PASSWORD',
    email: 'admin@biras.demo',
    firstName: 'Site',
    lastName: 'Admin',
    role: 'ADMIN',
  },
  {
    envEmail: 'SEED_MANAGER_EMAIL',
    envPassword: 'SEED_MANAGER_PASSWORD',
    email: 'manager@biras.demo',
    firstName: 'Store',
    lastName: 'Manager',
    role: 'MANAGER',
  },
  {
    envEmail: 'SEED_STAFF_EMAIL',
    envPassword: 'SEED_STAFF_PASSWORD',
    email: 'staff@biras.demo',
    firstName: 'Floor',
    lastName: 'Staff',
    role: 'STAFF',
  },
  {
    envEmail: 'SEED_CUSTOMER_EMAIL',
    envPassword: 'SEED_CUSTOMER_PASSWORD',
    email: 'customer@biras.demo',
    firstName: 'Test',
    lastName: 'Customer',
    role: 'CUSTOMER',
  },
];

/**
 * Spread a product's total stock across its size × colour grid.
 *
 * Any remainder lands on the first variant so the sum matches the product total
 * exactly — an inventory report that does not reconcile is worse than useless.
 */
function distributeStock(product: SeedProduct): number[] {
  const count = product.sizes.length * product.colours.length;
  const base = Math.floor(product.stock / count);
  const remainder = product.stock - base * count;

  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function variantSku(product: SeedProduct, size: string, colour: SeedColour): string {
  const suffix = product.slug
    .split('-')
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('');

  // Colour names in the catalogue contain spaces ("One Size" style labels aside),
  // so the code is stripped rather than cut, to keep every SKU URL-safe.
  const colourCode = colour.name.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3);
  const sizeCode = size.replace(/[^a-z0-9]/gi, '').toUpperCase();

  return `BC-${suffix}-${sizeCode}-${colourCode}`;
}

async function seedCatalogue(): Promise<void> {
  const categoryBySlug = new Map<string, string>();

  for (const category of seedCategories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        description: category.description,
        image: category.image,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });

    categoryBySlug.set(category.slug, row.id);
  }

  for (const product of seedProducts) {
    const categoryId = categoryBySlug.get(product.category);

    if (!categoryId) {
      throw new Error(`Product "${product.slug}" references unknown category "${product.category}".`);
    }

    const productRow = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.slug.toUpperCase(),
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        categoryId,
        subcategory: product.subcategory,
        badge: product.badge,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
      },
      update: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        categoryId,
        subcategory: product.subcategory,
        badge: product.badge,
        rating: product.rating,
        reviewCount: product.reviewCount,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isBestSeller: product.isBestSeller,
        isActive: true,
        deletedAt: null,
      },
    });

    /*
     * Images and variants are replaced rather than merged. Re-seeding a changed
     * catalogue should not leave orphaned rows from an older definition, and
     * because stock is derived from the seed data this is the simplest way to
     * keep the two in step.
     */
    await prisma.productImage.deleteMany({ where: { productId: productRow.id } });
    await prisma.productVariant.deleteMany({ where: { productId: productRow.id } });

    await prisma.productImage.createMany({
      data: product.images.map((url, sortOrder) => ({
        productId: productRow.id,
        url,
        altText: `${product.name} — image ${sortOrder + 1}`,
        sortOrder,
      })),
    });

    const grid = product.sizes.flatMap((size) =>
      product.colours.map((colour) => ({ size, colour })),
    );
    const quantities = distributeStock(product);

    await prisma.productVariant.createMany({
      data: grid.map((cell, index) => ({
        productId: productRow.id,
        sku: variantSku(product, cell.size, cell.colour),
        size: cell.size,
        color: cell.colour.name,
        colorHex: cell.colour.hex,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockQuantity: quantities[index] ?? 0,
        lowStockThreshold: 5,
        isActive: true,
      })),
    });
  }
}

async function seedUsers_(): Promise<string[]> {
  const skipped: string[] = [];

  for (const spec of seedUsers) {
    const email = process.env[spec.envEmail] ?? spec.email;
    const password = process.env[spec.envPassword];

    if (!password) {
      skipped.push(`${spec.role} (set ${spec.envPassword})`);
      continue;
    }

    await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: spec.role,
        emailVerified: true,
      },
      // The role is reset too: re-seeding should be able to restore an account an
      // operator demoted by accident, and the password comes from the environment.
      update: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        role: spec.role,
        isActive: true,
        emailVerified: true,
      },
    });
  }

  return skipped;
}

async function seedStoreSettings(): Promise<void> {
  for (const [key, value] of Object.entries(seedSettings)) {
    await prisma.storeSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: {},
    });
  }
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The seed is not allowed to run with NODE_ENV=production.');
  }

  console.log('Seeding catalogue...');
  await seedCatalogue();

  console.log('Seeding store settings...');
  await seedStoreSettings();

  console.log('Seeding accounts...');
  const skipped = await seedUsers_();

  if (skipped.length > 0) {
    console.warn('');
    console.warn('These accounts were skipped because no password was set in the environment:');
    for (const entry of skipped) console.warn(`  - ${entry}`);
    console.warn('');
  }

  const [categories, products, variants, users] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.user.count(),
  ]);

  console.log(
    `Done. ${categories} categories, ${products} products, ${variants} variants, ${users} users.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });