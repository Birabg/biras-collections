/*
 * Application errors.
 *
 * Every error the API raises deliberately extends AppError and carries an HTTP
 * status plus a stable machine-readable code. The central error handler is the
 * only place that turns these into a response, which keeps the client contract
 * uniform and stops internal details (stack traces, Prisma messages, SQL) from
 * ever reaching a user.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_STATE'
  | 'RATE_LIMITED'
  | 'PAYMENT_ERROR'
  | 'INTERNAL_ERROR';

export interface FieldIssue {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly isOperational = true;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', issues?: FieldIssue[]) {
    super(400, 'VALIDATION_ERROR', message, issues ? { issues } : undefined);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'You need to sign in to continue.', code: ErrorCode = 'AUTHENTICATION_ERROR') {
    super(401, code, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to do that.') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'That change conflicts with the current state.') {
    super(409, 'CONFLICT', message);
  }
}

export class InsufficientStockError extends AppError {
  constructor(message = 'Some items are no longer available in the requested quantity.') {
    super(409, 'INSUFFICIENT_STOCK', message);
  }
}

export class InvalidStateError extends AppError {
  constructor(message = 'That action is not valid from the current state.') {
    super(409, 'INVALID_STATE', message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please slow down and try again shortly.') {
    super(429, 'RATE_LIMITED', message);
  }
}

export class PaymentError extends AppError {
  constructor(message = 'The payment could not be processed.') {
    super(402, 'PAYMENT_ERROR', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Something went wrong.') {
    super(500, 'INTERNAL_ERROR', message);
  }
}