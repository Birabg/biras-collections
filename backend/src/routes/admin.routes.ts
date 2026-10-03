import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth';
import * as controller from '../controllers/admin.controller';
import * as product from '../controllers/product.controller';
import {
  adminOrderQuerySchema,
  updateOrderStatusSchema,
  adminCustomerQuerySchema,
  setCustomerActiveSchema,
  updateUserRoleSchema,
  inventoryAdjustSchema,
  inventoryQuerySchema,
  reportQuerySchema,
  setStockLevelSchema,
  settingUpsertSchema,
} from '../validators/admin.schema';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/product.schema';

/*
 * Admin API.
 *
 * Authorisation is per-route and permission-based, mirroring `src/auth/roles.js`.
 * The router only requires a signed-in staff member; each handler then demands
 * the specific permission it performs. A single `requireRole('ADMIN')` on the
 * router would contradict that model — it would lock MANAGER out of the
 * catalogue authority the permission table grants it, and the UI would offer a
 * "New product" button whose every request answered 403.
 *
 * The frontend hides what a role cannot do, but that is presentation only —
 * these gates are the actual enforcement.
 */

const router = Router();

router.use(requireAuth);

/* -------------------------------------------------------------- dashboard --*/

router.get('/dashboard', requirePermission(PERMISSIONS.ORDERS_READ), controller.dashboard);

/* ----------------------------------------------------------------- reports --*/

router.get(
  '/reports/sales',
  requirePermission(PERMISSIONS.REPORTS_READ),
  validate('query', reportQuerySchema),
  controller.salesReport,
);
router.get(
  '/reports/orders',
  requirePermission(PERMISSIONS.REPORTS_READ),
  validate('query', reportQuerySchema),
  controller.ordersReport,
);
router.get(
  '/reports/products',
  requirePermission(PERMISSIONS.REPORTS_READ),
  validate('query', reportQuerySchema),
  controller.productsReport,
);
router.get(
  '/reports/categories',
  requirePermission(PERMISSIONS.REPORTS_READ),
  validate('query', reportQuerySchema),
  controller.categoriesReport,
);

/* ------------------------------------------------------------------ orders --*/

router.get(
  '/orders',
  requirePermission(PERMISSIONS.ORDERS_READ),
  validate('query', adminOrderQuerySchema),
  controller.listOrders,
);
router.get('/orders/:id', requirePermission(PERMISSIONS.ORDERS_READ), controller.getOrder);
router.patch(
  '/orders/:id/status',
  requirePermission(PERMISSIONS.ORDERS_UPDATE),
  validate('body', updateOrderStatusSchema),
  controller.updateOrderStatus,
);

/* --------------------------------------------------------------- customers --*/

router.get(
  '/customers',
  requirePermission(PERMISSIONS.CUSTOMERS_READ),
  validate('query', adminCustomerQuerySchema),
  controller.listCustomers,
);
router.get('/customers/:id', requirePermission(PERMISSIONS.CUSTOMERS_READ), controller.getCustomer);
router.patch(
  '/customers/:id/status',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate('body', setCustomerActiveSchema),
  controller.setCustomerActive,
);
router.patch(
  '/customers/:id/role',
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validate('body', updateUserRoleSchema),
  controller.updateUserRole,
);

/* --------------------------------------------------------------- inventory --*/

router.get(
  '/inventory',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  validate('query', inventoryQuerySchema),
  controller.listInventory,
);
router.get(
  '/inventory/:id/movements',
  requirePermission(PERMISSIONS.INVENTORY_READ),
  controller.listMovements,
);
router.post(
  '/inventory/:id/adjust',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validate('body', inventoryAdjustSchema),
  controller.adjustStock,
);
router.put(
  '/inventory/:id/stock',
  requirePermission(PERMISSIONS.INVENTORY_WRITE),
  validate('body', setStockLevelSchema),
  controller.setStockLevel,
);

/* --------------------------------------------------------------- catalogue --*/

// Reading the catalogue needs no special authority, but writing does: this is
// the permission that lets a MANAGER add and edit products without being an
// ADMIN, matching what the back-office UI offers them.
router.get(
  '/products',
  requirePermission(PERMISSIONS.CATALOG_VIEW),
  validate('query', productQuerySchema),
  product.adminListProducts,
);
router.get(
  '/products/:id',
  requirePermission(PERMISSIONS.CATALOG_VIEW),
  product.adminGetProduct,
);
router.post(
  '/products',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate('body', createProductSchema),
  product.createProduct,
);
router.patch(
  '/products/:id',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  validate('body', updateProductSchema),
  product.updateProduct,
);
router.delete('/products/:id', requirePermission(PERMISSIONS.PRODUCTS_WRITE), product.deleteProduct);
router.post(
  '/products/:id/restore',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  product.restoreProduct,
);
router.patch(
  '/products/:id/flags',
  requirePermission(PERMISSIONS.PRODUCTS_WRITE),
  product.setProductFlags,
);
router.post(
  '/categories',
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  validate('body', createCategorySchema),
  product.createCategory,
);
router.patch(
  '/categories/:id',
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  validate('body', updateCategorySchema),
  product.updateCategory,
);
router.delete(
  '/categories/:id',
  requirePermission(PERMISSIONS.CATEGORIES_WRITE),
  product.deleteCategory,
);

/* ---------------------------------------------------------------- settings --*/

router.get('/settings', requirePermission(PERMISSIONS.SETTINGS_MANAGE), controller.listSettings);
router.get(
  '/settings/:key',
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  controller.getSetting,
);
router.put(
  '/settings/:key',
  requirePermission(PERMISSIONS.SETTINGS_MANAGE),
  validate('body', settingUpsertSchema),
  controller.upsertSetting,
);

export default router;