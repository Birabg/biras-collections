import { Router } from 'express';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import * as controller from '../controllers/order.controller';
import { createOrderSchema, orderQuerySchema } from '../validators/commerce.schema';

/*
 * Customer order routes.
 *
 * `orderNumber` is the public identifier used in the UI, so it is accepted for
 * lookup, but ownership is still resolved from the token — a customer who
 * guesses another order number gets a 404, never someone else's data.
 */

const router = Router();

router.use(requireAuth);

router.post('/', validate('body', createOrderSchema), controller.createOrder);
router.get('/', validate('query', orderQuerySchema), controller.listOwnOrders);
router.get('/:orderNumber', controller.getOwnOrder);
router.post('/:orderNumber/cancel', controller.cancelOwnOrder);

export default router;