import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { mapUser } from '../utils/mappers';
import { ok, created } from '../utils/http';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils/errors';
import { prisma } from '../config/prisma';
import { config } from '../config/env';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../validators/auth.schema';

/*
 * Auth controller.
 *
 * The refresh token never appears in a response body — it travels only in an
 * HTTP-only cookie, so script on the page cannot read it.
 */

function requestOrigin(req: Request): string {
  return (req.body as { origin?: string })?.origin || req.header('origin') || config.frontendUrl;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input, req);

  authService.setRefreshCookie(res, result.refreshToken);

  return created(res, {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.accessExpiresIn,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input, req);

  authService.setRefreshCookie(res, result.refreshToken);

  return ok(res, {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.accessExpiresIn,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.cookies?.[config.refreshCookie.name] as string | undefined);
  authService.clearRefreshCookie(res);

  return ok(res, { loggedOut: true });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[config.refreshCookie.name] as string | undefined;

  if (!token) throw new AuthenticationError('Your session has expired. Please sign in again.');

  const result = await authService.refresh(token, req);

  authService.setRefreshCookie(res, result.refreshToken);

  return ok(res, {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.accessExpiresIn,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) throw new NotFoundError('Your account no longer exists.');

  const permissions = authService.permissionsForRole(user.role);

  return ok(res, { user: mapUser(user), permissions });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = forgotPasswordSchema.parse(req.body);

  await authService.requestPasswordReset(input.email, requestOrigin(req));

  // Identical response whether or not the address exists.
  return ok(res, {
    sent: true,
    message: 'If an account exists for that address, a reset link is on its way.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const input = resetPasswordSchema.parse(req.body);

  await authService.resetPassword(input.token, input.password);

  return ok(res, { updated: true });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const input = changePasswordSchema.parse(req.body);

  await authService.changePassword(req.user!.id, input.currentPassword, input.newPassword);

  return ok(res, { updated: true });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);

  /*
   * `role` is absent from `input` because the Zod schema strips unknown keys, so
   * a payload containing `{"role":"ADMIN"}` is reduced to `{}` before it arrives.
   */
  if (Object.keys(input).length === 0) {
    throw new ValidationError('Provide at least one field to update.');
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(input.firstName !== undefined && { firstName: input.firstName }),
      ...(input.lastName !== undefined && { lastName: input.lastName }),
      ...(input.phone !== undefined && { phone: input.phone }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return ok(res, { user: mapUser(user) });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  // No verification mail is sent by the console provider, so this endpoint
  // reports that plainly rather than pretending to have verified anything.
  void verifyEmailSchema.parse(req.body);

  return ok(res, {
    verified: false,
    message: 'Email verification is not enabled in this build.',
  });
});