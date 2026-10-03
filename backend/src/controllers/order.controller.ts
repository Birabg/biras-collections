import type { Request, Response } from 'express';
import { z } from 'zod';
import * as orderService from '../services/order.service';
import { ok, created, paginated } from '../utils/http';
import { asyncHandler } from '../utils/asyncHandler';
import { buildPagination } from '../utils/pagination';
import { createOrderSchema, orderQuerySchema } from '../validators/commerce.schema';

/* --------------------------------------------------------------- checkout --*/

/**
 * Order placement.
 *
 * The request body contains no price, total or stock value. Everything is
 * recomputed server-side inside the transaction in order.service.
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const input = createOrderSchema.parse(req.body);
  const order = await orderService.createOrder(req.user!.id, input);

  return created(res, order);
});

/* ------------------------------------------------------------------ orders --*/

export const listOwnOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = orderQuerySchema.parse(req.valid);
  const pagination = buildPagination(query.page, query.limit);

  const result = await orderService.listOwnOrders(req.user!.id, {
    ...query,
    skip: pagination.skip,
  });

  return paginated(res, result.data, result.pagination);
});

export const getOwnOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().min(3).max(60) }).parse(req.params);
  const order = await orderService.getOwnOrder(req.user!.id, id);

  return ok(res, order);
});

export const cancelOwnOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = z.object({ orderNumber: z.string().min(3).max(60) }).parse(req.params);
  const order = await orderService.cancelOwnOrder(req.user!.id, orderNumber);

  return ok(res, order);
});