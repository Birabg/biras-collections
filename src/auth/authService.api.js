/**
 * Auth service — production implementation using the real API.
 *
 * Mirrors the exact interface of the demo authService so AuthContext
 * and every component continue to work without changes.
 *
 * Error codes are translated from the backend's standard envelope.
 */

import { api } from '../api/client';
import { ROLES, isRole } from './roles';

/** Machine-readable failure codes (must match backend's ErrorCode). */
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  EMAIL_INVALID: 'EMAIL_INVALID',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  TERMS_NOT_ACCEPTED: 'TERMS_NOT_ACCEPTED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SESSION_EXPIRED: 'AUTHENTICATION_ERROR',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK: 'NETWORK',
};

export class AuthError extends Error {
  constructor(code, message, details) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
    this.details = details;
  }
}

function mapBackendError(err) {
  if (err.code && AUTH_ERRORS[err.code]) {
    return new AuthError(err.code, err.message, err.details);
  }
  // Fallback: use HTTP status
  if (err.status === 400) return new AuthError('VALIDATION_ERROR', err.message, err.details);
  if (err.status === 401) return new AuthError('AUTHENTICATION_ERROR', err.message);
  if (err.status === 403) return new AuthError('AUTHORIZATION_ERROR', err.message);
  if (err.status === 404) return new AuthError('NOT_FOUND', err.message);
  if (err.status === 409) return new AuthError('CONFLICT', err.message);
  if (err.status === 429) return new AuthError('RATE_LIMITED', err.message);
  if (err.status >= 500) return new AuthError('INTERNAL_ERROR', 'The service is temporarily unavailable.');
  return new AuthError('NETWORK', err.message);
}

function normaliseUser(record) {
  if (!record) return null;
  const { passwordHash, ...safe } = record;
  return { ...safe, role: isRole(safe.role) ? safe.role : ROLES.CUSTOMER };
}

export const authService = {
  isDemo: false,

  /**
   * Re-hydrate session on boot / hard refresh.
   * Calls /auth/me which reads the HttpOnly refresh cookie and returns the user.
   */
  async restoreSession() {
    try {
      const data = await api.get('/auth/me');
      const user = normaliseUser(data.data);
      return { user, expired: false };
    } catch (err) {
      // Not authenticated or session expired — both are anonymous
      return { user: null, expired: err.status === 401 };
    }
  },

  async login({ email, password }) {
    try {
      const data = await api.post('/auth/login', { email, password });
      // access token returned in body; refresh cookie set by server
      if (data.data?.accessToken) {
        api.setAccessToken(data.data.accessToken);
      }
      return normaliseUser(data.data?.user ?? data.data);
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async register({ name, email, password, acceptedTerms }) {
    try {
      const data = await api.post('/auth/register', { name, email, password, acceptedTerms });
      if (data.data?.accessToken) {
        api.setAccessToken(data.data.accessToken);
      }
      return normaliseUser(data.data?.user ?? data.data);
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      api.setAccessToken(null);
    }
  },

  /**
   * Always succeeds. A real backend must not reveal whether the address exists,
   * and must send the reset link by email.
   */
  async requestPasswordReset({ email }) {
    try {
      await api.post('/auth/forgot-password', { email });
      return { sent: true };
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async resetPassword({ token, password }) {
    try {
      await api.post('/auth/reset-password', { token, password });
      return { updated: true };
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async changePassword({ currentPassword, newPassword }) {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { updated: true };
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async updateProfile({ firstName, lastName, phone }) {
    try {
      const data = await api.patch('/auth/me', { firstName, lastName, phone });
      return normaliseUser(data.data);
    } catch (err) {
      throw mapBackendError(err);
    }
  },

  async verifyEmail({ token }) {
    try {
      await api.post('/auth/verify-email', { token });
      return { verified: true };
    } catch (err) {
      throw mapBackendError(err);
    }
  },
};