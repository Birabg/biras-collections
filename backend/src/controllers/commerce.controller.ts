import type { Request, Response } from 'express';
import { z } from 'zod';
import * as cartService from '../services/cart.service';
import * as wishlistService from '../services/wishlist.service';
import * as addressService from '../services/address.service';
import * as orderService from '../services/order.service';
import { ok, created } from '../utils/http';
import { asyncHandler } from '../utils/asyncHandler';
import {
  addToCartSchema,
  updateCartItemSchema,
  wishlistSchema,
  addressSchema,
  updateAddressSchema,
} from '../validators/commerce.schema';

/*
 * Customer-scoped controllers.
 *
 * Every handler takes the user id from `req.user.id` — set by requireAuth from a
 * verified token — and never from the request. There is no userId parameter
 * anywhere in this file, which is what makes IDOR structurally impossible here.
 */

/* -------------------------------------------------------------------- cart --*/

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.getCart(req.user!.id);

  return ok(res, { ...cart, ...cartService.shippingFor(cart.subtotal) });
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
  const input = addToCartSchema.parse(req.body);
  const cart = await cartService.addItem(req.user!.id, input);

  return created(res, { ...cart, ...cartService.shippingFor(cart.subtotal) });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { quantity } = updateCartItemSchema.parse(req.body);

  const cart = await cartService.updateItem(req.user!.id, id, quantity);

  return ok(res, { ...cart, ...cartService.shippingFor(cart.subtotal) });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const cart = await cartService.removeItem(req.user!.id, id);

  return ok(res, { ...cart, ...cartService.shippingFor(cart.subtotal) });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await cartService.clearCart(req.user!.id);

  return ok(res, cart);
});

/* ---------------------------------------------------------------- wishlist --*/

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.user!.id);

  return ok(res, wishlist);
});

export const addToWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = wishlistSchema.parse(req.body);
  const wishlist = await wishlistService.addToWishlist(req.user!.id, productId);

  return created(res, wishlist);
});

export const removeFromWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = wishlistSchema.parse(req.body);
  const wishlist = await wishlistService.removeFromWishlist(req.user!.id, productId);

  return ok(res, wishlist);
});

export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = wishlistSchema.parse(req.body);
  const result = await wishlistService.toggleWishlist(req.user!.id, productId);

  return ok(res, result);
});

export const checkWishlist = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = wishlistSchema.parse(req.params);
  const result = await wishlistService.isInWishlist(req.user!.id, productId);

  return ok(res, result);
});

export const clearWishlist = asyncHandler(async (req: Request, res: Response) => {
  const wishlist = await wishlistService.clearWishlist(req.user!.id);

  return ok(res, wishlist);
});

/* --------------------------------------------------------------- addresses --*/

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await addressService.listAddresses(req.user!.id);

  return ok(res, addresses);
});

export const getAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const address = await addressService.getAddress(req.user!.id, id);

  return ok(res, address);
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const data = addressSchema.parse(req.body);
  const address = await addressService.createAddress(req.user!.id, data);

  return created(res, address);
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = updateAddressSchema.parse(req.body);

  const address = await addressService.updateAddress(req.user!.id, id, data);

  return ok(res, address);
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const result = await addressService.deleteAddress(req.user!.id, id);

  return ok(res, result);
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const address = await addressService.setDefaultAddress(req.user!.id, id);

  return ok(res, address);
});

/**
 * Read-only preview for the checkout page: cart contents, delivery options and
 * the totals the server will actually charge. Placing the order is a separate
 * endpoint, because this one changes nothing.
 */
export const getCheckoutSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await orderService.getCheckoutSummary(req.user!.id);

  return ok(res, summary);
});