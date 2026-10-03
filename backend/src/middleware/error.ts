import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, NotFoundError } from '../utils/errors';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import type { ErrorBody } from '../utils/http';

/*
 * Central error handling.
 *
 * Only AppError instances and a small allowlist of Prisma errors are translated
 * into a client message. Everything else — including raw Prisma output and any
 * unexpected exception — becomes a generic 500, because those messages can
 * disclose table names, column names or SQL. The full detail goes to the log
 * only, never to the response.
 */

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string; code: string }> = {
  P2002: { status: 409, message: 'That value is already in use.', code: 'CONFLICT' },
  P2003: { status: 400, message: 'A related record is missing.', code: 'VALIDATION_ERROR' },
  P2025: { status: 404, message: 'The requested record was not found.', code: 'NOT_FOUND' },
};

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`No route matches ${req.method} ${req.path}`));
}

export const notFound = notFoundHandler;

/* eslint-disable @typescript-eslint/no-unused-vars */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) return;

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong. Please try again.';
  let details: unknown;

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'The submitted data is invalid.';
    details = {
      issues: error.issues.map((issue) => ({
        field: issue.path.join('.') || '_root',
        message: issue.message,
      })),
    };
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = PRISMA_ERROR_MAP[error.code];

    if (mapped) {
      status = mapped.status;
      code = mapped.code;
      message = mapped.message;
    } else {
      status = 400;
      code = 'DATABASE_ERROR';
      message = 'The request could not be completed.';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'The submitted data is invalid.';
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    status = 500;
    code = 'DATABASE_ERROR';
    message = 'The request could not be completed.';
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'The service is temporarily unavailable.';
  } else {
    /*
     * Body-parser errors come from `http-errors`, which tags itself with a numeric
     * `status`/`statusCode` and a `type`. They are not SyntaxErrors — an oversized
     * body arrives as a PayloadTooLargeError — so they are matched structurally
     * and mapped to their real status rather than being reported as a 500.
     */
    const httpError = asHttpError(error);

    if (httpError) {
      status = httpError.status;
      code = httpError.status === 413 ? 'PAYLOAD_TOO_LARGE' : 'VALIDATION_ERROR';
      message = httpError.status === 413 ? 'The request body is too large.' : 'The request body is not valid JSON.';
    }
  }

  const logMeta = {
    method: req.method,
    path: req.originalUrl,
    status,
    code,
    userId: req.user?.id,
    requestId: req.id,
  };

  if (status >= 500) {
    logger.error(message, { ...logMeta, error });
  } else {
    logger.warn(message, { ...logMeta, error });
  }

  const body: ErrorBody = { success: false, message, code };
  if (details !== undefined) body.details = details;

  // Stacks are a development affordance only.
  if (!config.isProduction && status >= 500 && error instanceof Error) {
    body.details = { ...(details as object | undefined), stack: error.stack };
  }

  res.status(status).json(body);
}

/**
 * Recognises an `http-errors` instance — the shape body-parser raises — and
 * returns its status when that status is one a client could act on.
 *
 * Matching on the numeric `status` field rather than on a class name keeps this
 * working across body-parser versions, and the 400-499 bound means a genuine
 * unexpected exception carrying a stray `status` property is never mistaken for
 * a clean client error.
 */
function asHttpError(error: unknown): { status: number } | null {
  if (!(error instanceof Error)) return null;

  const candidate = error as { status?: unknown; statusCode?: unknown; type?: unknown };

  const raw = typeof candidate.status === 'number' ? candidate.status : candidate.statusCode;

  if (typeof raw !== 'number' || !Number.isInteger(raw)) return null;
  if (raw < 400 || raw > 499) return null;
  // Only body-parser's errors are `http-errors`; anything else is unexpected.
  if (typeof candidate.type !== 'string') return null;

  return { status: raw };
}