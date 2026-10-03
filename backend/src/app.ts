import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthorizationError } from './utils/errors';
import { generalLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import commerceRoutes from './routes/commerce.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import { config } from './config/env';
import { accessLog, requestId } from './middleware/requestLogger';
import { errorHandler, notFound } from './middleware/error';
import { prisma } from './config/prisma';
import { asyncHandler } from './utils/asyncHandler';
import { openapiDocument, docsPage } from './utils/openapi';

/*
 * App factory.
 *
 * All routes are versioned under /api/v1. Global middleware is registered in a
 * deliberate order: security first, cookie parsing, request id/logging, body
 * parsing, then routes, then the 404 and error handlers last.
 */

export const createApp = () => {
  const app = express();

  // Security headers. `crossOriginResourcePolicy` is relaxed because the
  // storefront loads product images from this API on a different origin.
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS is an explicit allowlist. A wildcard is never used: it would let any
  // site on the internet make authenticated requests against a logged-in user.
  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: same-origin, curl, or a server-to-server call.
        if (!origin) return callback(null, true);
        if (config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new AuthorizationError('This origin is not allowed.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
      maxAge: 86_400,
    }),
  );

  // Required for req.cookies and therefore for the refresh cookie.
  app.use(cookieParser());

  // A broad safety net; credential routes add a much tighter limiter of their own.
  app.use(generalLimiter);

  // Request id is assigned before anything else so even a rejected request is traceable.
  app.use(requestId);
  app.use(accessLog);

  // Trust proxy only when explicitly enabled, since it also changes the client IP
  // that rate limiting keys on.
  if (config.trustProxy) {
    app.set('trust proxy', 1);
  }

  // Body parsers with sensible limits.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Health check must be unauthenticated and fast. If the database cannot be
  // reached this returns 503 instead of throwing a generic 500 without detail.
  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      let dbOk = false;
      let dbLatency = 0;

      try {
        const started = Date.now();
        await prisma.$queryRawUnsafe('SELECT 1');
        dbLatency = Date.now() - started;
        dbOk = true;
      } catch {
        dbOk = false;
      }

      const status = dbOk ? 200 : 503;
      return res.status(status).json({
        success: dbOk,
        status: dbOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          api: 'ok',
          database: dbOk ? 'ok' : 'unavailable',
          dbLatencyMs: dbOk ? dbLatency : undefined,
        },
      });
    }),
  );

  // The API contract, served from a static spec so it can be diffed and
  // reviewed. Generated docs would need swagger-ui-express, which is an extra
  // runtime dependency and another attack surface for a read-only page.
  app.get('/docs.json', (_req, res) => res.json(openapiDocument));
  app.get('/docs', (_req, res) => res.type('html').send(docsPage));

  // Versioned API surface.
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/products', productRoutes);
  // Commerce routes carry their own sub-paths (/cart, /wishlist, /addresses).
  app.use('/api/v1', commerceRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 404 for unknown routes.
  app.use(notFound);

  // Centralized error handling (must be last).
  app.use(errorHandler);

  return app;
};

export type AppType = ReturnType<typeof createApp>;