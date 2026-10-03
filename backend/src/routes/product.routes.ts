import { Router } from 'express';
import { validate } from '../middleware/validate';
import * as controller from '../controllers/product.controller';
import { productQuerySchema } from '../validators/product.schema';

/*
 * Public product routes.
 *
 * Read-only and unauthenticated: catalogue browsing must work for a signed-out
 * shopper. The static path segments are declared before `/:slug` so they are not
 * captured as a slug.
 */

const router = Router();

router.get('/', validate('query', productQuerySchema), controller.listProducts);
router.get('/categories', controller.listCategories);
router.get('/categories/:slug', controller.getCategory);
router.get('/:id/related', controller.getRelated);
router.get('/:slug', controller.getProduct);

export default router;