import type { Response } from 'express';
import type { Prisma } from '@prisma/client';

/*
 * Response envelope + Prisma/Decimal helpers.
 *
 * The frontend already has a contract: `{ success, data }` and
 * `{ success, message, code }`. Every endpoint funnels through `ok`/`fail` so
 * that contract cannot drift.
 */

export interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorBody {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

export function ok<T>(res: Response, data: T, status = 200, meta?: Record<string, unknown>) {
  const body: SuccessBody<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, 201);
}

export function noContent(res: Response) {
  return res.status(204).send();
}

export function paginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number; totalPages: number },
) {
  return res.status(200).json({ success: true, data, pagination });
}

/* ------------------------------------------------------------------ money --*/

/**
 * Prisma returns Decimal instances. The frontend renders plain numbers, so
 * every value crossing the API boundary goes through here. Returning a number
 * keeps the JSON contract identical to the current hardcoded data.
 */
export function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}