/**
 * Auth service adapter — demo implementation (for reference/testing).
 * ============================================================================
 *  This file now ONLY contains the demo implementation and related constants.
 *  The production authService is exported from authService.api.js
 * ============================================================================
 */

import { ROLES, normaliseRole } from './roles';

const DEMO_FLAG = 'biras_auth_backend';
const SESSION_KEY = 'biras_session';
const USERS_KEY = 'biras_demo_users';

/** Session lifetime. Short enough to exercise the expiry UX. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

/** Seed accounts so every actor can be inspected. Passwords are intentionally public. */
export const DEMO_ACCOUNTS = [
  { email: 'guest@biras.demo', password: 'demo1234', name: 'Guest Shopper', role: ROLES.CUSTOMER },
  { email: 'staff@biras.demo', password: 'demo1234', name: 'Staff Member', role: ROLES.STAFF },
  { email: 'manager@biras.demo', password: 'demo1234', name: 'Store Manager', role: ROLES.MANAGER },
  { email: 'admin@biras.demo', password: 'demo1234', name: 'Administrator', role: ROLES.ADMIN },
];

export const DEMO_CREDENTIALS = { password: 'demo1234' };

/* ------------------------------------------------------------- demo storage */

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the session simply will not persist */
  }
};

const removeKey = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
};

const normaliseEmail = (email) => String(email ?? '').trim().toLowerCase();

const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------ demo service factory */

export function createDemoAuthService() {
  /** Seed the demo user directory once. */
  function ensureSeeded() {
    if (localStorage.getItem(DEMO_FLAG) === 'true') return;
    writeJSON(
      USERS_KEY,
      DEMO_ACCOUNTS.map((account) => ({
        email: normaliseEmail(account.email),
        password: account.password,
        name: account.name,
        role: account.role,
        locked: false,
      })),
    );
    localStorage.setItem(DEMO_FLAG, 'true');
  }

  function readUsers() {
    ensureSeeded();
    return readJSON(USERS_KEY, []);
  }

  function writeUsers(users) {
    writeJSON(USERS_KEY, users);
  }

  function publicUser(record) {
    if (!record) return null;
    // Stripped, never read: the point is to keep it out of `safe`.
    const { password: _password, ...safe } = record;
    return { ...safe, role: normaliseRole(safe.role) };
  }

  function issueSession(user) {
    const session = {
      user,
      issuedAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    writeJSON(SESSION_KEY, session);
    return session;
  }

  return {
    /** True while the demo backend is in use. Drives the "demo" UI banner. */
    isDemo: true,

    /**
     * Re-hydrate the session on boot / page refresh.
     * @returns {Promise<{user: object|null, expired: boolean}>}
     */
    async restoreSession() {
      await delay(200);
      const session = readJSON(SESSION_KEY, null);

      if (!session?.user) return { user: null, expired: false };

      if (typeof session.expiresAt === 'number' && session.expiresAt <= Date.now()) {
        removeKey(SESSION_KEY);
        return { user: null, expired: true };
      }

      // Re-read the record so a role change is reflected, and so a deleted
      // user cannot keep a live session.
      const record = readUsers().find((u) => u.email === session.user.email);
      if (!record || record.locked) {
        removeKey(SESSION_KEY);
        return { user: null, expired: Boolean(session) };
      }

      const user = publicUser(record);
      issueSession(user);
      return { user, expired: false };
    },

    async login({ email, password }) {
      await delay(650);
      const users = readUsers();
      const user = users.find((u) => u.email === normaliseEmail(email));

      // Same message for "no such user" and "wrong password" so the form does
      // not disclose which emails are registered.
      if (!user || user.password !== password) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (user.locked) {
        throw new Error('ACCOUNT_LOCKED');
      }

      const safe = publicUser(user);
      issueSession(safe);
      return safe;
    },

    async register({ name, email, password, acceptedTerms }) {
      await delay(700);

      if (!acceptedTerms) {
        throw new Error('TERMS_NOT_ACCEPTED');
      }

      const users = readUsers();
      const normalised = normaliseEmail(email);

      if (users.some((u) => u.email === normalised)) {
        throw new Error('EMAIL_TAKEN');
      }

      const record = {
        email: normalised,
        password,
        name: String(name ?? '').trim(),
        role: ROLES.CUSTOMER, // self-registration can never grant a staff role
        locked: false,
        createdAt: new Date().toISOString(),
      };

      writeUsers([...users, record]);

      const safe = publicUser(record);
      issueSession(safe);
      return safe;
    },

    async logout() {
      await delay(200);
      removeKey(SESSION_KEY);
    },

    /**
     * Always succeeds. A real implementation must not reveal whether the
     * address exists, and must send the reset link by email.
     */
    async requestPasswordReset() {
      await delay(600);
      return { sent: true };
    },

    async resetPassword({ token }) {
      await delay(650);
      if (!token) {
        throw new Error('INVALID_RESET_TOKEN');
      }
      return { updated: true };
    },

    /** Test hook for the session-expiry path. Demo backend only. */
    async expireSessionForTesting() {
      const session = readJSON(SESSION_KEY, null);
      if (!session) return;
      writeJSON(SESSION_KEY, { ...session, expiresAt: Date.now() - 1 });
    },
  };
}

/**
 * The app imports the production authService from authService.api.js.
 * This file keeps the demo implementation for reference/testing.
 */
export { authService, AuthError, AUTH_ERRORS } from './authService.api';
export {
  ROLES,
  isRole,
  normaliseRole,
  roleIsOneOf,
  roleHasPermission,
  permissionsFor,
  roleLabel,
} from './roles';