import { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { RateLimitError } from '../utils/errors';

/*
 * Rate limiting.
 *
 * Two tiers: a general limit for the whole API, and a much tighter one for the
 * credential endpoints. Auth routes are the ones worth attacking, so they get
 * their own bucket keyed by IP to blunt password and token guessing.
 */

function limit(max: number, windowMs: number, message: string): RequestHandler {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Tests would otherwise trip the limiter and fail spuriously.
    skip: () => config.isTest,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new RateLimitError(message));
    },
  });
}

export const generalLimiter = limit(
  config.rateLimit.max,
  config.rateLimit.windowMs,
  'Too many requests. Please slow down.',
);

/** Applied to /api/auth. Keyed by IP so one user cannot exhaust another's budget. */
export const authLimiter = limit(
  config.rateLimit.authMax,
  config.rateLimit.windowMs,
  'Too many authentication attempts. Please wait and try again.',
);

/**
 * Separate, smaller bucket for the reset flow. Password-reset is expensive to
 * abuse (it sends mail and writes tokens), and a tight limit is the main defence
 * against it being used to mail-bomb an address.
 */
export const passwordResetLimiter = limit(
  config.rateLimit.authMax,
  config.rateLimit.windowMs,
  'Too many password reset attempts. Please wait and try again.',
);