import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
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
 * The whole router sits behind requireRole(ADMIN, SUPER_ADMIN): anything mounted
 * here is staff-only, so no individual handler needs to repeat the check. The
 * frontend hides what a role cannot do, but that is presentation only — these
 * gates are the actual enforcement.
 */

const router = Router();

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'));

/* -------------------------------------------------------------- dashboard --*/

router.get('/dashboard', controller.dashboard);

/* ----------------------------------------------------------------- reports --*/

router.get('/reports/sales', validate('query', reportQuerySchema), controller.salesReport);
router.get('/reports/orders', validate('query', reportQuerySchema), controller.ordersReport);
router.get('/reports/products', validate('query', reportQuerySchema), controller.productsReport);
router.get('/reports/categories', validate('query', reportQuerySchema), controller.categoriesReport);

/* ------------------------------------------------------------------ orders --*/

router.get('/orders', validate('query', adminOrderQuerySchema), controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.patch('/orders/:id/status', validate('body', updateOrderStatusSchema), controller.updateOrderStatus);

/* --------------------------------------------------------------- customers --*/

router.get('/customers', validate('query', adminCustomerQuerySchema), controller.listCustomers);
router.get('/customers/:id', controller.getCustomer);
router.patch(
  '/customers/:id/status',
  validate('body', setCustomerActiveSchema),
  controller.setCustomerActive,
);
router.patch('/customers/:id/role', validate('body', updateUserRoleSchema), controller.updateUserRole);

/* --------------------------------------------------------------- inventory --*/

router.get('/inventory', validate('query', inventoryQuerySchema), controller.listInventory);
router.get('/inventory/:id/movements', controller.listMovements);
router.post('/inventory/:id/adjust', validate('body', inventoryAdjustSchema), controller.adjustStock);
router.put('/inventory/:id/stock', validate('body', setStockLevelSchema), controller.setStockLevel);

/* --------------------------------------------------------------- catalogue --*/

router.get('/products', validate('query', productQuerySchema), product.adminListProducts);
router.get('/products/:id', product.adminGetProduct);
router.post('/products', validate('body', createProductSchema), product.createProduct);
router.patch('/products/:id', validate('body', updateProductSchema), product.updateProduct);
router.delete('/products/:id', product.deleteProduct);
router.post('/products/:id/restore', product.restoreProduct);
router.patch('/products/:id/flags', product.setProductFlags);
router.post('/categories', validate('body', createCategorySchema), product.createCategory);
router.patch('/categories/:id', validate('body', updateCategorySchema), product.updateCategory);
router.delete('/categories/:id', product.deleteCategory);

/* ---------------------------------------------------------------- settings --*/

router.get('/settings', controller.listSettings);
router.get('/settings/:key', controller.getSetting);
router.put('/settings/:key', validate('body', settingUpsertSchema), controller.upsertSetting);

export default router;