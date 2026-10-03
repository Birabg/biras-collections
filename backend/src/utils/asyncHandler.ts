import { NextFunction, Request, RequestHandler, Response } from 'express';

/*
 * Async route wrapper.
 *
 * Express 5 forwards rejected promises to the error handler, but wrapping
 * handlers keeps the intent explicit and means a forgotten `await` inside a
 * controller cannot silently produce an unhandled rejection.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}