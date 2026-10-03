import { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { hashToken } from '../utils/tokens';
import type { Role } from '@prisma/client';

/*
 * Authentication and authorisation.
 *
 * The rule this file exists to enforce: the frontend's role gates are UX only.
 * Every one of these middlewares re-derives the user's identity, role and
 * permissions from the database on each request, so editing localStorage, or
 * posting `{"role":"ADMIN"}`, changes nothing.
 */

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/* ------------------------------------------------------- permission model --*/

/**
 * Mirrors `src/auth/roles.js` exactly. The frontend already gates on these
 * strings, and duplicating the model server-side is the point: the client copy
 * is a convenience, this copy is the enforcement.
 */
export const PERMISSIONS = {
  CATALOG_VIEW: 'catalog:view',
  CART_WRITE: 'cart:write',
  ORDER_CREATE: 'order:create',
  PROFILE_READ: 'profile:read',
  PROFILE_WRITE: 'profile:write',
  ADDRESSES_MANAGE: 'addresses:manage',
  ORDERS_OWN_READ: 'orders:own:read',
  WISHLIST_MANAGE: 'wishlist:manage',

  ORDERS_READ: 'orders:read',
  INVENTORY_READ: 'inventory:read',
  CUSTOMERS_READ: 'customers:read',
  REPORTS_READ: 'reports:read',

  ORDERS_UPDATE: 'orders:update',
  PRODUCTS_WRITE: 'products:write',
  CATEGORIES_WRITE: 'categories:write',
  INVENTORY_WRITE: 'inventory:write',

  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  CUSTOMER: [
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.CART_WRITE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.ADDRESSES_MANAGE,
    PERMISSIONS.ORDERS_OWN_READ,
    PERMISSIONS.WISHLIST_MANAGE,
  ],
  STAFF: [
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CUSTOMERS_READ,
  ],
  MANAGER: [
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_WRITE,
    PERMISSIONS.REPORTS_READ,
  ],
  ADMIN: Object.values(PERMISSIONS),
  SUPER_ADMIN: Object.values(PERMISSIONS),
};

export function permissionsFor(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Roles allowed into the administrative area at all. */
export const BACKOFFICE_ROLES: Role[] = ['STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];

/* ------------------------------------------------------------------ tokens --*/

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: Math.floor(config.jwt.accessExpiresMs / 1000),
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JwtPayload;

    // A refresh token must never be accepted as an access token. Both are
    // signed with different secrets, but the explicit check documents intent.
    if (decoded.type !== 'access') throw new Error('wrong token type');

    return {
      sub: String(decoded.sub),
      email: String(decoded.email),
      role: decoded.role as Role,
      type: 'access',
    };
  } catch {
    // Deliberately vague: distinguishing "expired" from "malformed" helps an
    // attacker probe token handling. The client treats both the same way.
    throw new AuthenticationError('Your session is invalid or has expired.', 'AUTHENTICATION_ERROR');
  }
}

export function verifyRefreshToken(token: string): { sub: string; jti: string } {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JwtPayload;

    if (decoded.type !== 'refresh') throw new Error('wrong token type');

    return { sub: String(decoded.sub), jti: String(decoded.jti) };
  } catch {
    throw new AuthenticationError('Your session has expired. Please sign in again.');
  }
}

/* --------------------------------------------------------------- middleware --*/

function bearerToken(req: Request): string | null {
  const header = req.header('authorization');

  if (!header) return null;

  const [scheme, token] = header.split(' ');

  if (!token || scheme?.toLowerCase() !== 'bearer') return null;

  return token.trim();
}

/**
 * Requires a valid access token. The user row is re-read on every request, so a
 * deactivated account or a role change takes effect immediately rather than
 * persisting until the 15-minute token expires.
 */
export const requireAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = bearerToken(req);

    if (!token) throw new AuthenticationError('You need to sign in to continue.');

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!user) throw new AuthenticationError('Your account no longer exists.');
    if (!user.isActive) throw new AuthenticationError('This account has been disabled.');

    // Trust the database role, not the token's claim.
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/** Attaches `req.user` when a valid token is present, but never rejects. */
export const optionalAuth: RequestHandler = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = bearerToken(req);
    if (!token) return next();

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (user?.isActive) req.user = user;
  } catch {
    // An invalid token is simply treated as anonymous here.
  }

  next();
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AuthenticationError());

    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('Your role does not have access to this resource.'));
    }

    next();
  };
}

export function requirePermission(...permissions: Permission[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AuthenticationError());

    const granted = permissionsFor(req.user.role);

    const allowed = permissions.every((permission) => granted.includes(permission));

    if (!allowed) return next(new AuthorizationError('You do not have permission to do that.'));

    next();
  };
}

/* --------------------------------------------------- refresh token helpers --*/

/**
 * Consumes a refresh token: verifies the signature, then requires a matching
 * *unrevoked, unexpired* row. Rotation deletes the presented row, so a stolen
 * token is single-use.
 */
export async function consumeRefreshToken(token: string) {
  const { sub } = verifyRefreshToken(token);
  const tokenHash = hashToken(token);

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt <= new Date() || record.userId !== sub) {
    throw new AuthenticationError('Your session has expired. Please sign in again.');
  }

  if (!record.user.isActive) throw new AuthenticationError('This account has been disabled.');

  return record;
}