/**
 * API client for Bira's Collections.
 *
 * All calls include credentials so the HttpOnly refresh cookie is sent.
 * The access token is attached from memory (not localStorage) so XSS cannot
 * steal it. On 401 the client attempts a single silent refresh before
 * bubbling the error to the AuthContext.
 */

const API_BASE = '/api/v1';

let accessToken = null;
let refreshInFlight = null;

function setAccessToken(token) {
  accessToken = token;
}

function getAccessToken() {
  return accessToken;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // required for refresh cookie
  });

  // 401 with a body means the server explicitly rejected (e.g., wrong password)
  // 401 without a body (or with generic message) means the access token expired
  if (response.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry once with new token
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      return fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(data?.message ?? `HTTP ${response.status}`);
    error.status = response.status;
    error.code = data?.code;
    error.details = data?.details;
    throw error;
  }

  return data;
}

async function attemptRefresh() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Refresh failed');
      const data = await response.json();
      accessToken = data.data?.accessToken ?? null;
      return true;
    } catch {
      accessToken = null;
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  setAccessToken,
  getAccessToken,
};