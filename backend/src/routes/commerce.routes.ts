import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import * as controller from '../controllers/commerce.controller';
import {
  addToCartSchema,
  updateCartItemSchema,
  wishlistSchema,
  addressSchema,
  updateAddressSchema,
} from '../validators/commerce.schema';

/*
 * Customer commerce routes: cart, wishlist, addresses, checkout summary.
 *
 * Every route is authenticated, and none of them accepts a user id — ownership
 * comes from the verified token in `req.user`. That is what makes the IDOR case
 * structurally impossible rather than merely guarded against.
 */

const router = Router();

/*
 * The guard is scoped to the sub-paths this router actually owns, rather than
 * `router.use(requireAuth)` for the whole router. This module is mounted at
 * /api/v1, so an unscoped guard would also catch genuinely unknown paths like
 * /api/v1/nonsense and answer 401 instead of 404 — which both leaks the auth
 * requirement and sends the caller looking for a missing route that does not
 * exist.
 */
const COMMERCE_PATHS = ['/cart', '/wishlist', '/addresses', '/checkout'];

router.use(COMMERCE_PATHS, requireAuth);

/* -------------------------------------------------------------------- cart --*/

router.get('/cart', controller.getCart);
router.post('/cart', validate('body', addToCartSchema), controller.addToCart);
router.patch('/cart/:id', validate('body', updateCartItemSchema), controller.updateCartItem);
router.delete('/cart/:id', controller.removeCartItem);
router.delete('/cart', controller.clearCart);

/* ---------------------------------------------------------------- wishlist --*/

router.get('/wishlist', controller.getWishlist);
router.post('/wishlist', validate('body', wishlistSchema), controller.addToWishlist);
router.post('/wishlist/toggle', validate('body', wishlistSchema), controller.toggleWishlist);
router.delete('/wishlist', validate('body', wishlistSchema), controller.removeFromWishlist);
router.get('/wishlist/:productId', controller.checkWishlist);
router.delete('/wishlist/all', controller.clearWishlist);

/* --------------------------------------------------------------- addresses --*/

router.get('/addresses', controller.listAddresses);
router.post('/addresses', validate('body', addressSchema), controller.createAddress);
router.get('/addresses/:id', controller.getAddress);
router.patch('/addresses/:id', validate('body', updateAddressSchema), controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);
router.post('/addresses/:id/default', controller.setDefaultAddress);

/* ---------------------------------------------------------------- checkout --*/

/**
 * Read-only preview for the checkout page: cart contents, delivery options and
 * the totals the server will actually charge. Placing the order is a separate
 * endpoint, because this one changes nothing.
 */
router.get('/checkout', controller.getCheckoutSummary);

export default router;