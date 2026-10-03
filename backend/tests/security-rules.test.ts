import { describe, expect, it } from 'vitest';
import { PERMISSIONS, permissionsFor } from '../src/middleware/auth';
import { registerSchema, updateProfileSchema } from '../src/validators/auth.schema';
import {
  createProductSchema,
  productQuerySchema,
  setProductFlagsSchema,
} from '../src/validators/product.schema';
import {
  adminCustomerQuerySchema,
  inventoryAdjustSchema,
  reportQuerySchema,
  updateOrderStatusSchema,
  updateUserRoleSchema,
} from '../src/validators/admin.schema';
import { createOrderSchema } from '../src/validators/commerce.schema';

describe('role permissions', () => {
  it('gives a customer nothing that touches the back office', () => {
    const granted = permissionsFor('CUSTOMER');

    for (const permission of Object.values(PERMISSIONS)) {
      if (permission.startsWith('orders:read') || permission.startsWith('inventory:')) {
        expect(granted).not.toContain(permission);
      }
    }

    expect(granted).not.toContain(PERMISSIONS.ORDERS_READ);
    expect(granted).not.toContain(PERMISSIONS.INVENTORY_READ);
    expect(granted).not.toContain(PERMISSIONS.PRODUCTS_WRITE);
    expect(granted).not.toContain(PERMISSIONS.USERS_MANAGE);
    expect(granted).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
  });

  it('keeps staff read-only over operations and out of catalogue writes', () => {
    const staff = permissionsFor('STAFF');

    expect(staff).toContain(PERMISSIONS.ORDERS_READ);
    expect(staff).toContain(PERMISSIONS.ORDERS_UPDATE);
    expect(staff).toContain(PERMISSIONS.INVENTORY_READ);

    expect(staff).not.toContain(PERMISSIONS.INVENTORY_WRITE);
    expect(staff).not.toContain(PERMISSIONS.PRODUCTS_WRITE);
    expect(staff).not.toContain(PERMISSIONS.CATEGORIES_WRITE);
    expect(staff).not.toContain(PERMISSIONS.USERS_MANAGE);
  });

  it('lets a manager write catalogue and stock but not manage users', () => {
    const manager = permissionsFor('MANAGER');

    expect(manager).toContain(PERMISSIONS.INVENTORY_WRITE);
    expect(manager).toContain(PERMISSIONS.PRODUCTS_WRITE);
    expect(manager).toContain(PERMISSIONS.REPORTS_READ);

    expect(manager).not.toContain(PERMISSIONS.USERS_MANAGE);
    expect(manager).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
  });

  it('grows the back-office capability set monotonically with rank', () => {
    const ladder = ['STAFF', 'MANAGER', 'ADMIN'] as const;

    for (let i = 1; i < ladder.length; i += 1) {
      const below = new Set(permissionsFor(ladder[i - 1]!));
      const above = new Set(permissionsFor(ladder[i]!));

      // Promotion must never take a back-office capability away, or the
      // hierarchy is a lie.
      for (const permission of below) {
        expect(above).toContain(permission);
      }
    }
  });

  it('keeps the storefront capability set separate from the back office', () => {
    // Documented, deliberate: STAFF and MANAGER are back-office roles and do not
    // get a shopping cart. Only ADMIN, who holds every permission, does.
    expect(permissionsFor('CUSTOMER')).toContain(PERMISSIONS.CART_WRITE);
    expect(permissionsFor('STAFF')).not.toContain(PERMISSIONS.CART_WRITE);
    expect(permissionsFor('MANAGER')).not.toContain(PERMISSIONS.CART_WRITE);
    expect(permissionsFor('ADMIN')).toContain(PERMISSIONS.CART_WRITE);

    // Every role that can reach the back office can still read the catalogue.
    for (const role of ['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']) {
      expect(permissionsFor(role)).toContain(PERMISSIONS.CATALOG_VIEW);
    }
  });

  it('grants admins every permission', () => {
    expect(permissionsFor('ADMIN').sort()).toEqual(Object.values(PERMISSIONS).sort());
    expect(permissionsFor('SUPER_ADMIN').sort()).toEqual(Object.values(PERMISSIONS).sort());
  });

  it('grants nothing to an unknown or absent role', () => {
    expect(permissionsFor('GHOST')).toEqual([]);
    expect(permissionsFor('')).toEqual([]);
    expect(permissionsFor('admin')).toEqual([]);
  });
});

describe('mass assignment', () => {
  const validRegister = {
    email: 'someone@example.com',
    password: 'Correct-Horse-9',
    firstName: 'Someone',
    lastName: 'Person',
    acceptedTerms: true,
  };

  it('strips a role supplied at registration', () => {
    const parsed = registerSchema.parse({ ...validRegister, role: 'SUPER_ADMIN', isActive: true });

    expect(parsed).not.toHaveProperty('role');
    expect(parsed).not.toHaveProperty('isActive');
    expect(parsed).toHaveProperty('email', 'someone@example.com');
  });

  it('strips privilege fields from a profile update', () => {
    const parsed = updateProfileSchema.parse({
      firstName: 'Renamed',
      role: 'ADMIN',
      passwordHash: 'x',
      emailVerified: true,
    });

    expect(Object.keys(parsed)).toEqual(['firstName']);
  });

  it('strips price and stock from a product create', () => {
    const parsed = createProductSchema.parse({
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-1',
      description: 'A product used in a test.',
      price: 100,
      categoryId: '00000000-0000-4000-8000-000000000000',
      reviewCount: 5,
      rating: 5,
      deletedAt: new Date().toISOString(),
    });

    expect(parsed).not.toHaveProperty('deletedAt');
    expect(parsed.reviewCount).toBe(5);
    expect(parsed.variants).toEqual([]);
    expect(parsed.images).toEqual([]);
  });

  it('rejects an admin trying to set a variant stock count through a product write', () => {
    const parsed = createProductSchema.parse({
      name: 'Test Product',
      slug: 'test-product',
      sku: 'TEST-1',
      description: 'A product used in a test.',
      price: 100,
      categoryId: '00000000-0000-4000-8000-000000000000',
      stock: 9999,
    });

    expect(parsed).not.toHaveProperty('stock');
  });

  it('strips totals from an order create, so a client cannot choose its own total', () => {
    const parsed = createOrderSchema.parse({
      shippingAddress: {
        fullName: 'Someone Person',
        phone: '+251911000000',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        subCity: 'Bole',
        streetAddress: 'Bole Road 42',
      },
      paymentMethod: 'CASH_ON_DELIVERY',
      subtotal: 1,
      shippingFee: 0,
      discount: 0,
      total: 1,
      status: 'DELIVERED',
      userId: '00000000-0000-4000-8000-000000000001',
    });

    expect(parsed).not.toHaveProperty('total');
    expect(parsed).not.toHaveProperty('subtotal');
    expect(parsed).not.toHaveProperty('status');
    expect(parsed).not.toHaveProperty('userId');
    expect(Object.keys(parsed).sort()).toEqual(['paymentMethod', 'shippingAddress']);
  });

  it('offers the simulated gateway, because otherwise no card checkout is testable', () => {
    // Without DEV in the enum the dev payment provider is unreachable through the
    // API and a local checkout can only ever be cash on delivery.
    expect(createOrderSchema.safeParse({
      shippingAddress: {
        fullName: 'Someone Person',
        phone: '+251911000000',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        subCity: 'Bole',
        streetAddress: 'Bole Road 42',
      },
      paymentMethod: 'DEV',
    }).success).toBe(true);

    expect(createOrderSchema.safeParse({
      shippingAddress: {
        fullName: 'Someone Person',
        phone: '+251911000000',
        region: 'Addis Ababa',
        city: 'Addis Ababa',
        subCity: 'Bole',
        streetAddress: 'Bole Road 42',
      },
      paymentMethod: 'BITCOIN',
    }).success).toBe(false);
  });
});

describe('admin input schemas', () => {
  it('will not let a client skip straight to DELIVERED', () => {
    expect(updateOrderStatusSchema.safeParse({ status: 'DELIVERED' }).success).toBe(true);

    expect(updateOrderStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
    expect(updateOrderStatusSchema.safeParse({ status: 'NOT_A_STATUS' }).success).toBe(false);
  });

  it('requires a non-zero, explainable stock adjustment', () => {
    expect(inventoryAdjustSchema.safeParse({ quantity: 5, reason: 'RESTOCK' }).success).toBe(true);
    expect(inventoryAdjustSchema.safeParse({ quantity: 0, reason: 'RESTOCK' }).success).toBe(false);
    expect(inventoryAdjustSchema.safeParse({ quantity: 5, reason: 'SALE' }).success).toBe(false);
  });

  it('restricts product flags to the two switches that exist', () => {
    expect(setProductFlagsSchema.safeParse({ isFeatured: true }).success).toBe(true);
    expect(setProductFlagsSchema.safeParse({}).success).toBe(false);
    expect(setProductFlagsSchema.safeParse({ isDeleted: true }).success).toBe(false);
  });

  it('treats SUPER_ADMIN as a real role, so the enum cannot drift from the schema', () => {
    expect(updateUserRoleSchema.safeParse({ role: 'SUPER_ADMIN' }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ role: 'OWNER' }).success).toBe(false);
  });

  it('coerces query strings into booleans, or rejects them', () => {
    expect(adminCustomerQuerySchema.parse({ isActive: 'true' }).isActive).toBe(true);
    expect(adminCustomerQuerySchema.parse({ isActive: 'false' }).isActive).toBe(false);
    expect(adminCustomerQuerySchema.parse({}).isActive).toBeUndefined();
    expect(adminCustomerQuerySchema.safeParse({ isActive: 'maybe' }).success).toBe(false);
  });

  it('applies report defaults and rejects an unbounded limit', () => {
    expect(reportQuerySchema.parse({}).interval).toBe('day');
    expect(reportQuerySchema.parse({}).limit).toBe(10);
    expect(reportQuerySchema.safeParse({ limit: '5000' }).success).toBe(false);
    expect(reportQuerySchema.safeParse({ interval: 'decade' }).success).toBe(false);
  });
});

describe('pagination', () => {
  it('defaults to the first page', () => {
    const parsed = productQuerySchema.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBeGreaterThan(0);
    expect(parsed.sort).toBe('newest');
  });

  it('rejects a hostile page or limit rather than passing it to the database', () => {
    // Failing fast with a 400 is better than silently clamping, because a client
    // asking for page -5 has a bug that should be visible.
    expect(productQuerySchema.safeParse({ page: '-5' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ page: '1e9' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ limit: '100000' }).success).toBe(false);
    expect(productQuerySchema.safeParse({ limit: 'abc' }).success).toBe(false);
  });

  it('accepts the allowlisted sort keys', () => {
    expect(productQuerySchema.parse({ sort: 'price-asc' }).sort).toBe('price-asc');
    expect(productQuerySchema.safeParse({ sort: 'price; DROP TABLE users' }).success).toBe(false);
  });
});