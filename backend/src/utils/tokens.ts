import { createHash } from 'crypto';
import { config } from '../config/env';

/*
 * Token and password helpers.
 *
 * Refresh and reset tokens are stored as SHA-256 hashes, not raw values: a
 * database leak then yields nothing usable. SHA-256 is correct here (unlike for
 * passwords) because these are high-entropy random strings we generate, so there
 * is nothing to brute-force.
 */

import { randomBytes } from 'crypto';

/** URL-safe random token. 48 bytes = 384 bits of entropy. */
export function generateOpaqueToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOrderNumber(sequence: number, year = new Date().getFullYear()): string {
  // BC-2026-000001
  return `BC-${year}-${String(sequence).padStart(6, '0')}`;
}

/** Stable per-order reference for the payment provider. */
export function generatePaymentReference(): string {
  return `PAY-${randomBytes(8).toString('hex').toUpperCase()}`;
}

export function generateRequestId(): string {
  return randomBytes(8).toString('hex');
}

export { config };