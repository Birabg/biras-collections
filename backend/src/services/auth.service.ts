import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { generateOpaqueToken, hashToken } from '../utils/tokens';
import { signAccessToken, permissionsFor } from '../middleware/auth';
import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { mapUser } from '../utils/mappers';
import { emailService } from './email.service';
import type { Role } from '@prisma/client';
import type { Request, Response } from 'express';

/*
 * Authentication service.
 *
 * Access tokens are short-lived signed JWTs sent in the Authorization header.
 * Refresh tokens are long-lived, stored server-side as SHA-256 hashes, and
 * delivered in an HTTP-only cookie — so script on the page cannot read them.
 * Every refresh rotates the token and revokes the presented one.
 */

const REFRESH_COOKIE = config.refreshCookie.name;

export function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.refreshCookie.sameSite,
    path: config.refreshCookie.path,
    maxAge: config.jwt.refreshExpiresMs,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.refreshCookie.sameSite,
    path: config.refreshCookie.path,
  });
}

/** bcrypt cost. Reduced in tests only, where the work factor is pure overhead. */
const rounds = config.isTest ? 4 : config.bcryptRounds;

/** Re-exported so controllers can report a user's permissions without importing the middleware. */
export const permissionsForRole = permissionsFor;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* -------------------------------------------------------------- issuance --*/

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
}

async function issueTokens(
  user: { id: string; email: string; role: Role },
  req: Request,
): Promise<TokenPair> {
  const refreshToken = generateOpaqueToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + config.jwt.refreshExpiresMs),
      userAgent: req.header('user-agent')?.slice(0, 255) ?? null,
      ipAddress: req.ip ?? null,
    },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  });

  return {
    accessToken,
    refreshToken,
    accessExpiresIn: Math.floor(config.jwt.accessExpiresMs / 1000),
  };
}

/* ------------------------------------------------------------ operations --*/

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptedTerms: boolean;
}

export async function register(input: RegisterInput, req: Request) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new ConflictError('An account already exists with that email address.');
  }

  /*
   * `role` is deliberately absent from the insert. Self-registration can only
   * ever produce a CUSTOMER, so there is no code path by which a signup request
   * can grant itself a staff role — not even by sending an extra field, because
   * the Zod schema strips unknown keys before this function is reached.
   */
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone ?? null,
      role: 'CUSTOMER',
      emailVerified: false,
    },
  });

  await prisma.cart.create({ data: { userId: user.id } });

  const tokens = await issueTokens(user, req);

  // Fire-and-forget: a mail failure must not fail the registration that already
  // succeeded. The failure is logged by the email service.
  void emailService.sendWelcome({ to: user.email, firstName: user.firstName });

  return { user: mapUser(user), ...tokens };
}

export async function login(input: { email: string; password: string }, req: Request) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  /*
   * Identical error for "no such account" and "wrong password" so the endpoint
   * cannot be used to enumerate which email addresses are registered.
   */
  const invalid = new AuthenticationError('We could not match that email and password.');

  if (!user) {
    // Hash anyway to keep the response time similar whether or not the account
    // exists, closing a user-enumeration timing side channel.
    await bcrypt.compare(input.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    throw invalid;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) throw invalid;

  if (!user.isActive) {
    throw new AuthorizationError('This account has been disabled. Please contact support.');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // An account that never used the cart still needs one.
  await prisma.cart.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const tokens = await issueTokens(user, req);

  return { user: mapUser(user), ...tokens };
}

export async function refresh(refreshToken: string, req: Request) {
  const tokenHash = hashToken(refreshToken);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const invalid = new AuthenticationError('Your session has expired. Please sign in again.');

  if (!record || record.revokedAt || record.expiresAt <= new Date()) throw invalid;

  if (!record.user.isActive) {
    // Deactivating an account must not leave usable refresh tokens behind.
    await prisma.refreshToken.deleteMany({ where: { userId: record.userId } });
    throw new AuthorizationError('This account has been disabled.');
  }

  /*
   * Rotation: the presented token is revoked as the new one is issued. Both
   * happen in one transaction so a crash cannot leave zero valid tokens.
   */
  const nextToken = generateOpaqueToken();

  const [, , user] = await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: record.userId,
        tokenHash: hashToken(nextToken),
        expiresAt: new Date(Date.now() + config.jwt.refreshExpiresMs),
        userAgent: req.header('user-agent')?.slice(0, 255) ?? null,
        ipAddress: req.ip ?? null,
      },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  });

  return {
    user: mapUser(user),
    accessToken,
    refreshToken: nextToken,
    accessExpiresIn: Math.floor(config.jwt.accessExpiresMs / 1000),
  };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken) return;

  // Revoking rather than deleting keeps the audit trail of the session.
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/* -------------------------------------------------------- password reset --*/

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordReset(email: string, origin: string) {
  const normalised = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalised } });

  /*
   * Always report success. Whether an address is registered is not something an
   * unauthenticated caller should be able to determine.
   */
  if (!user || !user.isActive) {
    return { sent: true };
  }

  const rawToken = generateOpaqueToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await emailService.sendPasswordReset({
    to: user.email,
    firstName: user.firstName,
    resetUrl,
    expiresInMinutes: Math.round(RESET_TTL_MS / 60000),
  });

  return { sent: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  const invalid = new AuthenticationError('This reset link is invalid or has already been used.');

  if (!record || record.usedAt || record.expiresAt <= new Date()) throw invalid;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // A password change must invalidate every existing session.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { updated: true };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new NotFoundError('Your account no longer exists.');

  const valid = await verifyPassword(currentPassword, user.passwordHash);

  if (!valid) {
    throw new AuthenticationError('Your current password is incorrect.');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(newPassword) },
    }),
    prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { updated: true };
}

export { jwt };