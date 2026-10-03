import { Prisma } from '@prisma/client';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../constants';

/*
 * Pagination.
 *
 * Every collection endpoint funnels through here. `limit` is capped so a client
 * cannot request the whole table in one response.
 */

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPagination(page?: number, limit?: number): Pagination {
  const safePage = Number.isFinite(page) && (page as number) >= 1 ? Math.floor(page as number) : 1;
  const safeLimit =
    Number.isFinite(limit) && (limit as number) >= 1
      ? Math.min(Math.floor(limit as number), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildPageMeta(pagination: Pagination, total: number): PageMeta {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
  };
}

/** Clamp a page number that would otherwise overflow after filtering. */
export function clampPage(page: number, totalPages: number): number {
  if (totalPages === 0) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

export type OrderBy = Prisma.ProductOrderByWithRelationInput;