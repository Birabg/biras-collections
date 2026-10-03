import type { Request, Response } from 'express';
import { z } from 'zod';
import * as adminService from '../services/admin.service';
import * as inventoryService from '../services/inventory.service';
import * as orderService from '../services/order.service';
import { ok, paginated } from '../utils/http';
import { asyncHandler } from '../utils/asyncHandler';
import { buildPagination } from '../utils/pagination';
import { prisma } from '../config/prisma';
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
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

/* -------------------------------------------------------------- dashboard --*/

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getDashboard();

  return ok(res, data);
});

/* ----------------------------------------------------------------- reports --*/

export const salesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = reportQuerySchema.parse(req.valid);
  const data = await adminService.salesReport(query);

  return ok(res, data);
});

export const ordersReport = asyncHandler(async (req: Request, res: Response) => {
  const query = reportQuerySchema.parse(req.valid);
  const data = await adminService.ordersReport(query);

  return ok(res, data);
});

export const productsReport = asyncHandler(async (req: Request, res: Response) => {
  const query = reportQuerySchema.parse(req.valid);
  const data = await adminService.productsReport(query);

  return ok(res, data);
});

export const categoriesReport = asyncHandler(async (req: Request, res: Response) => {
  const query = reportQuerySchema.parse(req.valid);
  const data = await adminService.categoriesReport({ from: query.from, to: query.to });

  return ok(res, data);
});

/* ----------------------------------------------------------------- orders --*/

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = adminOrderQuerySchema.parse(req.valid);
  const pagination = buildPagination(query.page, query.limit);

  const result = await orderService.adminListOrders({ ...query, skip: pagination.skip });

  return res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    summary: result.summary,
  });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().min(3).max(60) }).parse(req.params);
  const order = await orderService.adminGetOrder(id);

  return ok(res, order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().min(3).max(60) }).parse(req.params);
  const { status, note } = updateOrderStatusSchema.parse(req.body);

  const order = await orderService.updateOrderStatus(id, status, { note, actorId: req.user!.id });

  logger.info('order status changed', { orderNumber: order.orderNumber, to: status, actorId: req.user!.id });

  return ok(res, order);
});

/* -------------------------------------------------------------- customers --*/

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const query = adminCustomerQuerySchema.parse(req.valid);
  const pagination = buildPagination(query.page, query.limit);

  const result = await adminService.listCustomers({ ...query, skip: pagination.skip });

  return paginated(res, result.data, result.pagination);
});

export const getCustomer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const customer = await adminService.getCustomer(id);

  return ok(res, customer);
});

export const setCustomerActive = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { isActive } = setCustomerActiveSchema.parse(req.body);

  const customer = await adminService.setCustomerActive(id, isActive);

  return ok(res, customer);
});

/* ----------------------------------------------------------- role changes --*/

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { role } = updateUserRoleSchema.parse(req.body);

  /*
   * Promotion to SUPER_ADMIN is checked here as well as in the service, so the
   * denial is a proper 403 rather than a generic error.
   */
  if (role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    throw new AuthorizationError('Only a super administrator can grant that role.');
  }

  if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ADMIN') {
    throw new AuthorizationError('You cannot change roles.');
  }

  const user = await adminService.updateUserRole(id, role, req.user!);

  logger.info('user role changed', { targetId: id, role, actorId: req.user!.id });

  return ok(res, user);
});

/* -------------------------------------------------------------- inventory --*/

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const query = inventoryQuerySchema.parse(req.valid);
  const pagination = buildPagination(query.page, query.limit);

  const result = await inventoryService.listInventoryVariants({
    ...query,
    skip: pagination.skip,
  });

  return res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    summary: result.summary,
  });
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { quantity, reason, note } = inventoryAdjustSchema.parse(req.body);

  const result = await inventoryService.adjustStock(id, quantity, reason, {
    note,
    actorId: req.user!.id,
  });

  return ok(res, result);
});

export const setStockLevel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { stockQuantity } = setStockLevelSchema.parse(req.body);

  const result = await inventoryService.setStock(id, stockQuantity, req.user!.id);

  return ok(res, result);
});

export const listMovements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const movements = await inventoryService.getInventoryMovements(id);

  return ok(res, movements);
});

/* --------------------------------------------------------------- settings --*/

export const listSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await prisma.storeSetting.findMany({ orderBy: { key: 'asc' } });

  return ok(res, settings);
});

export const getSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = z.object({ key: z.string().min(1).max(80) }).parse(req.params);

  const setting = await prisma.storeSetting.findUnique({ where: { key } });

  if (!setting) throw new NotFoundError('That setting does not exist.');

  return ok(res, setting);
});

export const upsertSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = z.object({ key: z.string().min(1).max(80) }).parse(req.params);
  const { value } = settingUpsertSchema.parse(req.body);

  const setting = await prisma.storeSetting.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });

  logger.info('setting updated', { key, actorId: req.user!.id });

  return ok(res, setting);
});