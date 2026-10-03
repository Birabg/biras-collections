/**
 * Actors, roles and permissions — the single source of truth.
 *
 * The backend is the enforcement point (`backend/src/middleware/auth.ts`); this
 * table is what the UI hides things with. The two must agree, which is why the
 * role vocabulary and the transition rules are mirrored in `utils/orderStatus.js`
 * and normalised in one place rather than compared as raw strings.
 *
 * Nothing outside this file compares role strings, so a change here reaches every
 * component at once.
 */

/* ------------------------------------------------------------------ actors */

export const ROLES = {
  /** Not signed in. Represented by the absence of a user, never stored. */
  GUEST: 'guest',
  /** A registered shopper. */
  CUSTOMER: 'customer',
  /** Back-of-house. Order and inventory visibility, no user management. */
  STAFF: 'staff',
  /** Back-of-house with catalog and reporting authority. */
  MANAGER: 'manager',
  /** Full administrative authority. */
  ADMIN: 'admin',
  /** Unrestricted authority, including areas reserved for the owner. */
  SUPER_ADMIN: 'super_admin',
};

/** Roles that belong to the storefront rather than the back office. */
export const STOREFRONT_ROLES = [ROLES.CUSTOMER];
/** Roles that may enter the administrative area at all. */
export const BACKOFFICE_ROLES = [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
/** Roles that may enter the administrative area with full authority. */
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
/** Back-office roles that hold reporting authority. */
export const REPORTING_ROLES = [ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN];

/* -------------------------------------------------------------- permissions */

export const PERMISSIONS = {
  // Catalogue — readable by everyone, including guests
  CATALOG_VIEW: 'catalog:view',

  // Commerce
  CART_WRITE: 'cart:write',
  ORDER_CREATE: 'order:create',

  // Customer / self-service
  PROFILE_READ: 'profile:read',
  PROFILE_WRITE: 'profile:write',
  ADDRESSES_MANAGE: 'addresses:manage',
  ORDERS_OWN_READ: 'orders:own:read',
  WISHLIST_MANAGE: 'wishlist:manage',

  // Back office — read
  ORDERS_READ: 'orders:read',
  INVENTORY_READ: 'inventory:read',
  CUSTOMERS_READ: 'customers:read',
  REPORTS_READ: 'reports:read',

  // Back office — write
  ORDERS_UPDATE: 'orders:update',
  PRODUCTS_WRITE: 'products:write',
  CATEGORIES_WRITE: 'categories:write',
  INVENTORY_WRITE: 'inventory:write',

  // Administration
  USERS_MANAGE: 'users:manage',
  SETTINGS_MANAGE: 'settings:manage',
};

/* -------------------------------------------------------- role -> permission */

const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: [PERMISSIONS.CATALOG_VIEW, PERMISSIONS.CART_WRITE],

  [ROLES.CUSTOMER]: [
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.CART_WRITE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.ADDRESSES_MANAGE,
    PERMISSIONS.ORDERS_OWN_READ,
    PERMISSIONS.WISHLIST_MANAGE,
  ],

  [ROLES.STAFF]: [
    PERMISSIONS.CATALOG_VIEW,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.CUSTOMERS_READ,
  ],

  [ROLES.MANAGER]: [
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

  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
};

/* ------------------------------------------------------------------ helpers */

/**
 * Maps a role string from any source onto this module's vocabulary.
 *
 * The API serialises the Prisma enum, which is upper case ('ADMIN'), while the
 * UI stores lower case ('admin'). Comparing the raw strings silently failed and
 * downgraded every real user to CUSTOMER, so normalisation is done once here and
 * both auth services route through it.
 *
 * Unknown or missing values become CUSTOMER: the UI must never grant authority
 * it could not verify, so the fallback is the least privileged real role.
 */
export function normaliseRole(value) {
  if (typeof value !== 'string') return ROLES.CUSTOMER;

  const candidate = value.trim().toLowerCase().replace(/[\s-]+/g, '_');

  return Object.values(ROLES).includes(candidate) ? candidate : ROLES.CUSTOMER;
}

export function isRole(value) {
  return (
    typeof value === 'string' &&
    Object.values(ROLES).includes(value.trim().toLowerCase().replace(/[\s-]+/g, '_'))
  );
}

export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** True when `role` is one of `allowed` (empty list = no restriction). */
export function roleIsOneOf(role, allowed = []) {
  if (!allowed || allowed.length === 0) return true;
  return Boolean(role) && allowed.includes(role);
}

export function roleHasPermission(role, permission) {
  return permissionsFor(role).includes(permission);
}

/** Human label used in the UI. */
export function roleLabel(role) {
  switch (role) {
    case ROLES.CUSTOMER:
      return 'Customer';
    case ROLES.STAFF:
      return 'Staff';
    case ROLES.MANAGER:
      return 'Manager';
    case ROLES.ADMIN:
      return 'Administrator';
    case ROLES.SUPER_ADMIN:
      return 'Super Administrator';
    case ROLES.GUEST:
    default:
      return 'Guest';
  }
}
