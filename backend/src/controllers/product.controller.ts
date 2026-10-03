import type { Request, Response } from 'express';
import { z } from 'zod';
import * as productService from '../services/product.service';
import { ok, paginated, created } from '../utils/http';
import { asyncHandler } from '../utils/asyncHandler';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  setProductFlagsSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/product.schema';

/* --------------------------------------------------------------- products --*/

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.valid);
  const result = await productService.listProducts(query);

  return paginated(res, result.data, result.pagination);
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params);
  const product = await productService.getProductBySlug(slug);

  return ok(res, product);
});

export const getRelated = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const products = await productService.getRelatedProducts(id);

  return ok(res, products);
});

/* ------------------------------------------------------- admin  products --*/

export const adminListProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = productQuerySchema.parse(req.valid);
  const result = await productService.adminListProducts({ ...query, includeInactive: true });

  return paginated(res, result.data, result.pagination);
});

export const adminGetProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const product = await productService.adminGetProduct(id);

  return ok(res, product);
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const product = await productService.createProduct(data);

  return created(res, product);
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = updateProductSchema.parse(req.body);

  const product = await productService.updateProduct(id, data);

  return ok(res, product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const result = await productService.softDeleteProduct(id);

  return ok(res, result);
});

export const restoreProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const product = await productService.restoreProduct(id);

  return ok(res, product);
});

export const setProductFlags = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = setProductFlagsSchema.parse(req.body);

  const product = await productService.setProductFlags(id, data);

  return ok(res, product);
});

/* ------------------------------------------------------------- categories --*/

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await productService.listCategories();

  return ok(res, categories);
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = z.object({ slug: z.string().min(1) }).parse(req.params);
  const category = await productService.getCategoryBySlug(slug);

  return ok(res, category);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = createCategorySchema.parse(req.body);
  const category = await productService.createCategory(data);

  return created(res, category);
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = updateCategorySchema.parse(req.body);

  const category = await productService.updateCategory(id, data);

  return ok(res, category);
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const result = await productService.deleteCategory(id);

  return ok(res, result);
});