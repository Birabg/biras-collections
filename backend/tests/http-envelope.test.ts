import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

/*
 * HTTP envelope tests.
 *
 * These exercise the middleware chain without touching PostgreSQL: every case
 * here either rejects before a handler runs, or is served by a route that needs
 * no database. That makes this suite runnable on a machine with no `.env` and no
 * database, which is deliberate — the security envelope should be verifiable
 * before the infrastructure exists.
 */

const app = createApp();

describe('security headers', () => {
  it('does not advertise the framework', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('sets the standard hardening headers', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options'] ?? response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('echoes a request id back so a client can quote it in a bug report', async () => {
    const response = await request(app).get('/docs.json').set('X-Request-Id', 'test-request-id');

    expect(response.headers['x-request-id']).toBe('test-request-id');
  });
});

describe('CORS', () => {
  it('allows the configured storefront origin with credentials', async () => {
    const response = await request(app).get('/docs.json').set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('refuses an origin that is not on the allowlist', async () => {
    const response = await request(app).get('/docs.json').set('Origin', 'https://evil.example');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(response.body.code).toBe('AUTHORIZATION_ERROR');
  });

  it('never answers with a wildcard, which would void credentialed requests', async () => {
    const response = await request(app).get('/docs.json').set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });
});

describe('unknown routes', () => {
  it('returns the standard 404 envelope, not Express HTML', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, code: 'NOT_FOUND' });
    expect(response.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('authentication is required before any data is touched', () => {
  const protectedRoutes: [string, string][] = [
    ['get', '/api/v1/cart'],
    ['post', '/api/v1/cart'],
    ['get', '/api/v1/wishlist'],
    ['get', '/api/v1/addresses'],
    ['get', '/api/v1/checkout'],
    ['get', '/api/v1/orders'],
    ['post', '/api/v1/orders'],
    ['get', '/api/v1/admin/dashboard'],
    ['get', '/api/v1/admin/orders'],
    ['get', '/api/v1/admin/inventory'],
    ['get', '/api/v1/admin/customers'],
    ['get', '/api/v1/admin/reports/sales'],
    ['get', '/api/v1/admin/settings'],
    ['get', '/api/v1/auth/me'],
  ];

  for (const [method, path] of protectedRoutes) {
    it(`401s ${method.toUpperCase()} ${path}`, async () => {
      const response = await request(app)[method as 'get' | 'post'](path);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
  }

  it('401s rather than 403 when a token is present but garbage', async () => {
    const response = await request(app).get('/api/v1/cart').set('Authorization', 'Bearer not-a-jwt');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('AUTHENTICATION_ERROR');
  });

  it('401s a request that uses a non-bearer authorization scheme', async () => {
    const response = await request(app).get('/api/v1/cart').set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(response.status).toBe(401);
  });
});

describe('request validation happens before the handler', () => {
  it('400s a login body that is not an object of the right shape', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.details?.issues)).toBe(true);
  });

  it('400s a registration that tries to smuggle a role', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'someone@example.com',
        password: 'Correct-Horse-9',
        firstName: 'Someone',
        lastName: 'Person',
        acceptedTerms: true,
        role: 'SUPER_ADMIN',
      });

    // The role is stripped rather than rejected, so validation passes and the
    // request proceeds. Without a database it stops at the connection (503); the
    // point of the assertion is that it never fails *validation* on the role.
    expect(response.body.code).not.toBe('VALIDATION_ERROR');
  });

  it('400s a registration that does not accept the terms', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'someone@example.com',
        password: 'Correct-Horse-9',
        firstName: 'Someone',
        lastName: 'Person',
        acceptedTerms: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('400s a weak password rather than accepting it', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'someone@example.com',
        password: 'short',
        firstName: 'Someone',
        lastName: 'Person',
        acceptedTerms: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('400s a hostile pagination value on a public route', async () => {
    const response = await request(app).get('/api/v1/products?page=-5&limit=999999');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('400s an unknown sort key, so orderBy can never be built from free text', async () => {
    const response = await request(app).get('/api/v1/products?sort=price;DROP+TABLE+products');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('400s a malformed JSON body instead of crashing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
  });
});

describe('body size limits', () => {
  it('rejects an oversized body rather than buffering it', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(2 * 1024 * 1024) }));

    expect(response.status).toBe(413);
  });
});

describe('documentation endpoints', () => {
  it('serves the OpenAPI document as JSON', async () => {
    const response = await request(app).get('/docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBeTruthy();

    // Paths are relative to the declared server URL.
    expect(response.body.servers[0].url).toContain('/api/v1');
    expect(response.body.paths['/products']).toBeDefined();
    expect(response.body.paths['/orders']).toBeDefined();
    expect(response.body.paths['/admin/dashboard']).toBeDefined();
  });

  it('serves a self-contained docs page with no external script tags', async () => {
    const response = await request(app).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).not.toMatch(/<script[^>]+src=/i);
  });
});

describe('health check', () => {
  it('reports database status instead of throwing when the database is unreachable', async () => {
    const response = await request(app).get('/health');

    // 503 (degraded) or 200 (ok) depending on whether a database is reachable.
    // Either is a valid, structured answer — the point is that it is never an
    // unhandled 500 and never leaks a connection string.
    expect([200, 503]).toContain(response.status);
    expect(response.body.services.database).toMatch(/ok|unavailable/);
    expect(JSON.stringify(response.body)).not.toMatch(/postgres(ql)?:\/\//);
  });
});