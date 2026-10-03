import { ZodError, type ZodTypeAny, type output } from 'zod';
import type { Request, RequestHandler } from 'express';
import { ValidationError, type FieldIssue } from '../utils/errors';

/*
 * Request validation.
 *
 * Handlers must read `req.valid` rather than `req.body`, because `req.valid` is
 * the only value that has passed a schema. Unknown keys are stripped, which is
 * what prevents mass assignment: a client posting `{ "role": "ADMIN" }` has that
 * field removed before the service layer ever sees it.
 */

function toIssues(error: ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '_root',
    message: issue.message,
  }));
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      valid?: Record<string, unknown>;
    }
  }
}

/** Replaces `req.body` with the parsed, stripped, typed value. */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      next(new ValidationError('The submitted data is invalid.', toIssues(result.error)));
      return;
    }

    req.valid = result.data as Record<string, unknown>;
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    // Express 5 exposes `req.query` as a getter-only property, so the parsed
    // result is stashed on `valid` instead of assigned back.
    const result = schema.safeParse(req.query ?? {});

    if (!result.success) {
      next(new ValidationError('The query parameters are invalid.', toIssues(result.error)));
      return;
    }

    req.valid = result.data as Record<string, unknown>;
    next();
  };
}

export function validateParams<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params ?? {});

    if (!result.success) {
      next(new ValidationError('The path parameters are invalid.', toIssues(result.error)));
      return;
    }

    req.valid = result.data as Record<string, unknown>;
    next();
  };
}

/** `validate('body', schema)` — the form used throughout the route modules. */
export function validate(source: 'body' | 'query' | 'params', schema: ZodTypeAny): RequestHandler {
  switch (source) {
    case 'query':
      return validateQuery(schema);
    case 'params':
      return validateParams(schema);
    default:
      return validateBody(schema);
  }
}

/** Read an already-validated value, narrowed to the schema's output type. */
export function parsed<T extends ZodTypeAny>(req: Request, schema: T): output<T> {
  return schema.parse(req.valid ?? req.body ?? {}) as output<T>;
}