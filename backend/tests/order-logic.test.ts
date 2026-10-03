import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, canTransition } from '../src/constants';
import { round2, toNumber } from '../src/utils/http';
import { shippingFor } from '../src/services/cart.service';

describe('shippingFor', () => {
  it('charges the flat fee below the free-shipping threshold', () => {
    const empty = shippingFor(0);

    expect(empty.shippingFee).toBe(SHIPPING_FEE);
    expect(empty.total).toBe(SHIPPING_FEE);
    expect(empty.amountToFreeShipping).toBe(FREE_SHIPPING_THRESHOLD);

    expect(shippingFor(4_999.99).shippingFee).toBe(SHIPPING_FEE);
    expect(shippingFor(4_999.99).amountToFreeShipping).toBeCloseTo(0.01, 2);
  });

  it('is free exactly at the threshold, not above it', () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD).shippingFee).toBe(0);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD).total).toBe(FREE_SHIPPING_THRESHOLD);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD).amountToFreeShipping).toBe(0);

    expect(shippingFor(FREE_SHIPPING_THRESHOLD - 0.01).shippingFee).toBe(SHIPPING_FEE);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD + 0.01).shippingFee).toBe(0);
  });

  it('always returns total = subtotal + shippingFee', () => {
    for (const subtotal of [0, 1, 1_850, 4_999.99, 5_000, 12_345.67]) {
      const { shippingFee, total } = shippingFor(subtotal);

      expect(total).toBe(round2(subtotal + shippingFee));
      expect(shippingFee === 0 || shippingFee === SHIPPING_FEE).toBe(true);
    }
  });

  it('returns whole numbers of currency, never fractions of a cent', () => {
    for (const subtotal of [10.005, 10.004, 33.333, 1234.567]) {
      const { total } = shippingFor(subtotal);

      expect(total).toBe(round2(total));
    }
  });

  it('never reports a negative gap to free shipping', () => {
    for (const subtotal of [0, 100, FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD * 3]) {
      expect(shippingFor(subtotal).amountToFreeShipping).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10)).toBe(10);
  });

  it('never produces floating point noise like 0.1 + 0.2', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('toNumber', () => {
  it('treats null and undefined as zero rather than NaN', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('passes numbers through untouched', () => {
    expect(toNumber(1850.5)).toBe(1850.5);
  });
});

describe('canTransition', () => {
  it('follows the forward path through fulfilment', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'PROCESSING')).toBe(true);
    expect(canTransition('PROCESSING', 'SHIPPED')).toBe(true);
    expect(canTransition('SHIPPED', 'DELIVERED')).toBe(true);
  });

  it('cannot skip a step', () => {
    expect(canTransition('PENDING', 'SHIPPED')).toBe(false);
    expect(canTransition('PENDING', 'DELIVERED')).toBe(false);
  });

  it('cannot move backwards', () => {
    expect(canTransition('SHIPPED', 'PROCESSING')).toBe(false);
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false);
  });

  it('treats cancelled and delivered as terminal', () => {
    for (const from of ['DELIVERED', 'CANCELLED']) {
      for (const to of ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it('allows cancellation from every state before it ships', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    expect(canTransition('PROCESSING', 'CANCELLED')).toBe(true);
  });

  it('refuses transitions out of an unknown status', () => {
    expect(canTransition('NOT_A_STATUS', 'CANCELLED')).toBe(false);
  });
});