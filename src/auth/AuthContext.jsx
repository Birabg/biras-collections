import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { authService, AuthError, AUTH_ERRORS } from '../auth/authService';
import {
  ROLES,
  roleIsOneOf,
  roleHasPermission,
  permissionsFor,
  roleLabel as labelForRole,
} from '../auth/roles';

/**
 * Session status. `loading` must be honoured before rendering any protected
 * route, otherwise protected content flashes before the redirect.
 */
export const SESSION = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  ANONYMOUS: 'anonymous',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(SESSION.LOADING);
  const [sessionExpired, setSessionExpired] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Restore on boot / hard refresh
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { user: restored, expired } = await authService.restoreSession();
        if (cancelled) return;
        setUser(restored);
        setSessionExpired(expired);
        setStatus(restored ? SESSION.AUTHENTICATED : SESSION.ANONYMOUS);
      } catch {
        if (cancelled) return;
        setUser(null);
        setStatus(SESSION.ANONYMOUS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const authenticated = await authService.login(credentials);
    setUser(authenticated);
    setSessionExpired(false);
    setStatus(SESSION.AUTHENTICATED);
    return authenticated;
  }, []);

  const register = useCallback(async (details) => {
    const created = await authService.register(details);
    setUser(created);
    setSessionExpired(false);
    setStatus(SESSION.AUTHENTICATED);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setSessionExpired(false);
    setStatus(SESSION.ANONYMOUS);
  }, []);

  const requestPasswordReset = useCallback(
    (payload) => authService.requestPasswordReset(payload),
    [],
  );

  const resetPassword = useCallback((payload) => authService.resetPassword(payload), []);

  /** Called by the API layer on a 401 so the UI can react uniformly. */
  const invalidateSession = useCallback((reason = AUTH_ERRORS.SESSION_EXPIRED) => {
    setUser(null);
    setSessionExpired(reason === AUTH_ERRORS.SESSION_EXPIRED);
    setStatus(SESSION.ANONYMOUS);
  }, []);

  const value = useMemo(() => {
    const role = user?.role ?? ROLES.GUEST;

    return {
      // state
      user,
      role,
      status,
      sessionExpired,
      isDemoBackend: authService.isDemo === true,

      // derived
      isAuthenticated: status === SESSION.AUTHENTICATED && Boolean(user),
      isLoading: status === SESSION.LOADING,
      roleLabel: labelForRole(role),
      permissions: permissionsFor(role),

      // actions
      login,
      register,
      logout,
      requestPasswordReset,
      resetPassword,
      invalidateSession,

      // authorization — the only helpers components should use
      hasRole: (...allowed) => roleIsOneOf(role, allowed.flat()),
      can: (permission) => roleHasPermission(role, permission),
    };
  }, [user, status, sessionExpired, login, register, logout, requestPasswordReset, resetPassword, invalidateSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthError, AUTH_ERRORS, ROLES };
