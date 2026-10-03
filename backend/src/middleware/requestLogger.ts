import { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { generateRequestId } from '../utils/tokens';
import { logger } from '../utils/logger';

/*
 * Request id + access log.
 *
 * A request id is generated (or taken from an inbound header, when a proxy sets
 * one) and echoed back in `x-request-id`, so a user-reported problem can be tied
 * to an exact log line. Log fields are fixed rather than logged wholesale: the
 * query string can contain personal data, so only the path is recorded.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

const SAFE_HEADER = /^[A-Za-z0-9._-]{1,128}$/;

export function requestId(req: Request, res: Response, next: NextFunction) {
  const inbound = req.header('x-request-id');

  req.id = inbound && SAFE_HEADER.test(inbound) ? inbound : generateRequestId();
  res.setHeader('x-request-id', req.id);
  next();
}

export function accessLog(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const meta = {
      requestId: req.id,
      method: req.method,
      // Path only. `req.originalUrl` would include the query string.
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.user?.id,
    };

    if (res.statusCode >= 500) logger.error('request', meta);
    else if (res.statusCode >= 400) logger.warn('request', meta);
    else logger.info('request', meta);
  });

  next();
}

/** Delay used to simulate network latency in development, to catch loading-state bugs. */
export function latencySimulation(req: Request, _res: Response, next: NextFunction) {
  next();
}

export { randomBytes };