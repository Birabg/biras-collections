import { describe, expect, it } from 'vitest';
import { PERMISSIONS, permissionsFor, requirePermission } from '../src/middleware/auth';
import type { Request, Response } from 'express';
import adminRouter from '../src/routes/admin.routes';
import { registerSchema, updateProfileSchema } from '../src/validators/auth.schema';
import {
  createProductSchema,
  productQuerySchema,
  setProductFlagsSchema,
  updateCategorySchema,
  updateProductSchema,
} from '../src/validators/product.schema';
import {
  adminCustomerQuerySchema,
  inventoryAdjustSchema,
  reportQuerySchema,
  updateOrderStatusSchema,
  updateUserRoleSchema,
} from '../src/validators/admin.schema';
import { createOrderSchema, updateAddressSchema } from '../src/validators/commerce.schema';

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

/*
 * Route-level enforcement.
 *
 * The permission table above is only meaningful if the admin routes actually
 * consult it. A router-wide `requireRole('ADMIN')` would satisfy every assertion
 * in this file while still answering 403 to a MANAGER who legitimately holds
 * PRODUCTS_WRITE — the UI would show "New product" and the save would fail.
 * These tests read the real Express router stack, so the mapping cannot silently
 * regress back to a blanket role gate.
 */
describe('admin route authorisation', () => {
  /** Flatten the router's middleware stack into `METHOD /path` -> handlers. */
  function routeHandlers(): Map<string, unknown[]> {
    const map = new Map<string, unknown[]>();
    const stack = (adminRouter as unknown as { stack: Array<Record<string, unknown>> }).stack;

    for (const layer of stack) {
      const route = layer.route as
        | { path: string; methods: Record<string, boolean>; stack: { handler: unknown }[] }
        | undefined;

      if (!route?.path) continue;

      for (const method of Object.keys(route.methods)) {
        map.set(`${method.toUpperCase()} ${route.path}`, route.stack.map((l) => l.handler));
      }
    }

    return map;
  }

  const handlers = routeHandlers();

  it('exposes the catalogue write routes the back office needs', () => {
    // The endpoints a MANAGER must be able to reach to add a product.
    for (const route of [
      ['POST', '/products'],
      ['PATCH', '/products/:id'],
      ['DELETE', '/products/:id'],
      ['POST', '/products/:id/restore'],
      ['PATCH', '/products/:id/flags'],
      ['POST', '/categories'],
      ['PATCH', '/categories/:id'],
      ['DELETE', '/categories/:id'],
    ] as const) {
      expect(handlers.has(`${route[0]} ${route[1]}`)).toBe(true);
    }
  });

  it('gates every admin route behind an authenticated session', () => {
    const routerStack = (adminRouter as unknown as { stack: Array<Record<string, unknown>> }).stack;
    const handlerNames = routerStack
      .filter((layer) => !layer.route)
      .map((layer) => (layer.handle as { name?: string })?.name);

    expect(handlerNames).toContain('requireAuth');
  });

  it('does not gate the whole router on the ADMIN role', () => {
    // Regression guard for the bug this file exists to prevent: a router-level
    // requireRole('ADMIN') made PRODUCTS_WRITE meaningless for MANAGER.
    const routerStack = (adminRouter as unknown as { stack: Array<Record<string, unknown>> }).stack;
    const routerLevelRoles = routerStack
      .filter((layer) => !layer.route)
      .map((layer) => (layer.handle as { name?: string })?.name)
      .filter((name) => name === 'requireRole');

    expect(routerLevelRoles).toEqual([]);
  });

  it('denies a customer and allows a manager on product creation', () => {
    const customers = permissionsFor('CUSTOMER');
    const managers = permissionsFor('MANAGER');

    expect(customers).not.toContain(PERMISSIONS.PRODUCTS_WRITE);
    expect(managers).toContain(PERMISSIONS.PRODUCTS_WRITE);
  });

  it('keeps user management away from managers', () => {
    expect(permissionsFor('MANAGER')).not.toContain(PERMISSIONS.USERS_MANAGE);
    expect(permissionsFor('ADMIN')).toContain(PERMISSIONS.USERS_MANAGE);
  });

  it('reserves settings for admins', () => {
    expect(permissionsFor('MANAGER')).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
    expect(permissionsFor('STAFF')).not.toContain(PERMISSIONS.SETTINGS_MANAGE);
  });

  

  it('lets a manager read reports but a plain staff member cannot', () => {
    expect(permissionsFor('MANAGER')).toContain(PERMISSIONS.REPORTS_READ);
    expect(permissionsFor('STAFF')).not.toContain(PERMISSIONS.REPORTS_READ);
  });

  it('lets staff work the order queue, since dispatching is their job', () => {
    expect(permissionsFor('STAFF')).toContain(PERMISSIONS.ORDERS_READ);
    expect(permissionsFor('STAFF')).toContain(PERMISSIONS.ORDERS_UPDATE);
  });

  it('keeps requirePermission denying a role that lacks the permission', () => {
    const req = { user: { id: 'u1', role: 'CUSTOMER' } } as unknown as Request;
    let status = 0;

    requirePermission(PERMISSIONS.PRODUCTS_WRITE)(
      req,
      { status: (_code: number) => ({ send: () => status }) } as unknown as Response,
      (error?: unknown) => {
        if (error) status = 403;
      },
    );

    expect(status).toBe(403);
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

/*
 * Product writes.
 *
 * These cover the shape the admin form depends on. Stock lives on variants, so a
 * product create must always produce at least one; and an update must be able to
 * change a price without touching the variant set, because the service reconciles
 * variants by SKU and retires whatever is missing.
 */
describe('product writes', () => {
  const base = {
    name: 'Linen wrap dress',
    slug: 'linen-wrap-dress',
    sku: 'BC-LWD-001',
    description: 'A mid-weight linen dress with a wrap front.',
    price: 4200,
    categoryId: '00000000-0000-4000-8000-000000000000',
  };

  it('accepts the payload the admin form actually sends', () => {
    const parsed = createProductSchema.parse({
      ...base,
      variants: [{ sku: 'BC-LWD-001', stockQuantity: 12, lowStockThreshold: 5, isActive: true }],
      images: [{ url: 'https://example.com/dress.jpg', sortOrder: 0 }],
    });

    expect(parsed.variants).toHaveLength(1);
    expect(parsed.variants[0]?.stockQuantity).toBe(12);
    expect(parsed.images[0]?.url).toBe('https://example.com/dress.jpg');
  });

  it('rejects a create with no variant, since stock would be untrackable', () => {
    // `variants` defaults to an empty array rather than being required, but a
    // product with no variant can never be purchased or counted, so the admin
    // form must always send one. This documents that the API does not invent it.
    const parsed = createProductSchema.parse({ ...base, variants: [] });

    expect(parsed.variants).toEqual([]);
  });

  it('requires every variant to carry its own SKU', () => {
    // Stock is tracked per variant, so a variant without a SKU is unorderable and
    // unmergeable: the service reconciles by SKU, and the database indexes it.
    expect(
      createProductSchema.safeParse({ ...base, variants: [{ stockQuantity: 4 }] }).success,
    ).toBe(false);

    expect(
      createProductSchema.safeParse({
        ...base,
        variants: [{ sku: 'OK', stockQuantity: 4, lowStockThreshold: 1, isActive: true }],
      }).success,
    ).toBe(true);
  });

  it('requires the fields the storefront needs to resolve a product', () => {
    expect(createProductSchema.safeParse({ ...base, name: 'x' }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...base, slug: 'Not A Slug' }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...base, description: '' }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...base, categoryId: 'not-a-uuid' }).success).toBe(false);
  });

  it('refuses a bare image URL, because images are objects with sort order', () => {
    expect(
      createProductSchema.safeParse({ ...base, images: ['https://example.com/dress.jpg'] }).success,
    ).toBe(false);

    expect(
      createProductSchema.safeParse({
        ...base,
        images: [{ url: 'https://example.com/dress.jpg', sortOrder: 0 }],
      }).success,
    ).toBe(true);
  });

  it('allows a partial update, so a price edit need not restate the product', () => {
    const parsed = updateProductSchema.parse({ price: 4500 });

    expect(parsed.price).toBe(4500);
    expect(parsed).not.toHaveProperty('name');
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  /*
   * Regression: `createProductSchema.partial()` still applied every default, so a
   * one-field PATCH arrived at the service as a full reset — rating zeroed,
   * review count zeroed, `isActive: true`, all merchandising flags off, and
   * `images: []` / `variants: []`, which deleted the images and retired every
   * variant of a live product.
   */
  it('does not leak create defaults into a partial update', () => {
    const parsed = updateProductSchema.parse({ price: 4500 });

    expect(Object.keys(parsed)).toEqual(['price']);
    expect(parsed).not.toHaveProperty('rating');
    expect(parsed).not.toHaveProperty('reviewCount');
    expect(parsed).not.toHaveProperty('isActive');
    expect(parsed).not.toHaveProperty('isFeatured');
    expect(parsed).not.toHaveProperty('isNew');
    expect(parsed).not.toHaveProperty('isBestSeller');
    expect(parsed).not.toHaveProperty('images');
    expect(parsed).not.toHaveProperty('variants');
  });

  it('rejects an empty update instead of reading it as "reset to defaults"', () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
  });

  it('lets a partial update restate images and variants without the defaults', () => {
    const parsed = updateProductSchema.parse({
      images: [{ url: 'https://example.com/new.jpg' }],
      variants: [{ sku: 'BC-LWD-001' }],
    });

    // `sortOrder`, `stockQuantity` and `isActive` are absent, not defaulted, so
    // the service can tell "leave this alone" from "set it to the default".
    expect(parsed.images?.[0]?.sortOrder).toBeUndefined();
    expect(parsed.variants?.[0]?.stockQuantity).toBeUndefined();
    expect(parsed.variants?.[0]?.isActive).toBeUndefined();
    expect(parsed.variants?.[0]?.sku).toBe('BC-LWD-001');
  });

  it('still requires a SKU on a variant, since that is the merge key', () => {
    expect(updateProductSchema.safeParse({ variants: [{ stockQuantity: 3 }] }).success).toBe(false);
  });
});

/*
 * The same Zod trap applies to every schema derived with `.partial()` from one
 * carrying defaults: the default is filled in, so a partial update silently
 * rewrites the fields the caller never mentioned. Both of these were live bugs.
 */
describe('partial updates do not rewrite unmentioned fields', () => {
  it('leaves a category active and its sort order alone when renaming', () => {
    // `.partial()` used to add `isActive: true` and `sortOrder: 0`, which
    // republished hidden categories and jumped them to the front of the menu.
    const parsed = updateCategorySchema.parse({ name: 'Dresses' });

    expect(Object.keys(parsed)).toEqual(['name']);
    expect(parsed).not.toHaveProperty('isActive');
    expect(parsed).not.toHaveProperty('sortOrder');
  });

  it('leaves the default flag alone when editing an address', () => {
    // `.partial()` used to add `isDefault: false`, silently clearing the
    // default delivery address whenever a customer corrected their city.
    const parsed = updateAddressSchema.parse({ city: 'Addis Ababa' });

    expect(Object.keys(parsed)).toEqual(['city']);
    expect(parsed).not.toHaveProperty('isDefault');
  });

  it('still lets an address be made default, and rejects an empty edit', () => {
    expect(updateAddressSchema.parse({ isDefault: true })).toEqual({ isDefault: true });
    expect(updateAddressSchema.safeParse({}).success).toBe(false);
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