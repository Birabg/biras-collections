import { config } from '../config/env';
import { logger } from '../utils/logger';
import { PaymentError } from '../utils/errors';
import { generatePaymentReference } from '../utils/tokens';
import type { PaymentProvider } from '@prisma/client';

/*
 * Payment abstraction.
 *
 * IMPORTANT: no payment provider credentials are configured in this repository,
 * so no real money can move. The default `dev` provider simulates authorisation
 * for local development and is refused outright when NODE_ENV=production.
 *
 * The interface mirrors what a real Ethiopian provider (Telebirr, CBE Birr,
 * Chapa) needs, so switching providers is a configuration change, not a rewrite
 * of the order flow.
 *
 * Card data is never accepted, stored or logged. This service only ever handles
 * an opaque amount and an order reference.
 */

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  provider: PaymentProvider;
  returnUrl?: string;
}

export interface PaymentIntent {
  reference: string;
  status: 'REQUIRES_ACTION' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  /** Where a real provider would send the customer to authorise. */
  authorizationUrl: string | null;
  message: string;
}

export interface PaymentProviderAdapter {
  readonly name: string;
  isConfigured(): boolean;
  createIntent(input: CreatePaymentInput): Promise<PaymentIntent>;
  verify(reference: string): Promise<{ success: boolean; status: PaymentIntent['status'] }>;
  refund(reference: string, amount: number): Promise<{ success: boolean }>;
}

/* ------------------------------------------------------------- dev provider --*/

class DevPaymentProvider implements PaymentProviderAdapter {
  readonly name = 'dev';

  isConfigured() {
    return true;
  }

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const reference = generatePaymentReference();

    /*
     * Simulates the round trip a real gateway would take, so the frontend's
     * pending/succeeded states are genuinely exercised rather than skipped.
     */
    await new Promise((resolve) => setTimeout(resolve, 250));

    return {
      reference,
      status: 'SUCCEEDED',
      authorizationUrl: null,
      message:
        `Development payment simulated for ${input.orderNumber} (${input.amount} ${input.currency}). ` +
        'No provider was contacted and no funds were taken.',
    };
  }

  async verify() {
    return { success: true, status: 'SUCCEEDED' as const };
  }

  async refund() {
    return { success: true };
  }
}

/* -------------------------------------------------------- telebirr / cbe --*/

/**
 * Placeholder for Telebirr and CBE Birr. Both follow the same
 * initialise -> pay -> query pattern, so one implementation covers both until
 * credentials exist.
 *
 * Deliberately throws rather than faking a success, so a half-built integration
 * fails loudly instead of recording a payment that never happened.
 */
class UnavailablePaymentProvider implements PaymentProviderAdapter {
  constructor(
    readonly name: string,
    private readonly credentials: Record<string, string | undefined>,
  ) {}

  isConfigured() {
    return Object.values(this.credentials).every(Boolean);
  }

  private assertConfigured() {
    if (!this.isConfigured()) {
      throw new PaymentError(
        `${this.name} is not configured. Set the ${this.name.toUpperCase()}_* environment variables before using it.`,
      );
    }
  }

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    this.assertConfigured();
    void input;

    // Replaced with the provider's actual request when credentials are supplied.
    throw new PaymentError(`${this.name} integration is not implemented in this build.`);
  }

  async verify() {
    this.assertConfigured();
    return { success: false, status: 'FAILED' as const };
  }

  async refund() {
    this.assertConfigured();
    return { success: false };
  }
}

class ChapaPaymentProvider implements PaymentProviderAdapter {
  readonly name = 'chapa';

  isConfigured() {
    return Boolean(config.payment.chapa.secretKey);
  }

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    if (!this.isConfigured()) {
      throw new PaymentError('Chapa is not configured. Set CHAPA_SECRET_KEY before using it.');
    }

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.payment.chapa.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        email: input.customerEmail,
        first_name: 'Customer',
        tx_ref: input.orderNumber,
        callback_url: input.returnUrl,
        return_url: input.returnUrl,
      }),
    });

    if (!response.ok) {
      throw new PaymentError('The payment provider rejected the request.');
    }

    const payload = (await response.json()) as { status: string; data?: { checkout_url?: string } };

    if (payload.status !== 'success') {
      throw new PaymentError('The payment provider declined the transaction.');
    }

    return {
      reference: input.orderNumber,
      status: 'REQUIRES_ACTION',
      authorizationUrl: payload.data?.checkout_url ?? null,
      message: 'Redirect the customer to complete payment.',
    };
  }

  async verify(reference: string) {
    if (!this.isConfigured()) throw new PaymentError('Chapa is not configured.');

    const response = await fetch(`https://api.chapa.co/v1/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${config.payment.chapa.secretKey}` },
    });

    if (!response.ok) return { success: false, status: 'FAILED' as const };

    const payload = (await response.json()) as { status: string; message?: string };
    const success = payload.status === 'success';

    return { success, status: success ? ('SUCCEEDED' as const) : ('FAILED' as const) };
  }

  async refund(): Promise<{ success: boolean }> {
    // Chapa has no refund endpoint on their public API; a refund is reconciled
    // on the dashboard. Reporting failure is honest — the caller must not assume
    // money was returned.
    throw new PaymentError('Chapa refunds are handled through the Chapa dashboard.');
  }
}

/* ----------------------------------------------------------------- service --*/

const adapters: Record<string, PaymentProviderAdapter> = {
  dev: new DevPaymentProvider(),
  telebirr: new UnavailablePaymentProvider('telebirr', {
    appId: config.payment.telebirr.appId,
    appSecret: config.payment.telebirr.appSecret,
  }),
  cbe: new UnavailablePaymentProvider('cbe', {
    appId: config.payment.cbe.appId,
    appSecret: config.payment.cbe.appSecret,
  }),
  chapa: new ChapaPaymentProvider(),
};

class PaymentService {
  get defaultProvider() {
    return adapters[config.payment.provider] ?? adapters.dev!;
  }

  /**
   * Maps an order's stored provider to its adapter, so an order created under
   * one provider is always settled through that same provider.
   */
  adapterFor(provider: PaymentProvider): PaymentProviderAdapter {
    switch (provider) {
      case 'TELEBIRR':
        return adapters.telebirr!;
      case 'CBE_BIRR':
        return adapters.cbe!;
      case 'CHAPA':
        return adapters.chapa!;
      case 'CASH_ON_DELIVERY':
        return new (class {
          readonly name = 'cash_on_delivery';
          isConfigured() {
            return true;
          }
          async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
            // Nothing is charged now; the order is marked paid on delivery.
            return {
              reference: `COD-${input.orderNumber}`,
              status: 'PROCESSING',
              authorizationUrl: null,
              message: 'Payment will be collected on delivery.',
            };
          }
          async verify() {
            return { success: true, status: 'SUCCEEDED' as const };
          }
          async refund() {
            return { success: true };
          }
        })();
      case 'DEV':
      default:
        return adapters.dev!;
    }
  }

  /** Refuses to simulate payments in production. */
  private assertSafeForEnvironment(adapter: PaymentProviderAdapter) {
    if (config.isProduction && adapter.name === 'dev') {
      throw new PaymentError(
        'The development payment provider cannot be used in production. Configure a real provider.',
      );
    }
  }

  async createIntent(input: CreatePaymentInput): Promise<PaymentIntent> {
    const adapter = this.adapterFor(input.provider);
    this.assertSafeForEnvironment(adapter);

    if (config.isProduction && !adapter.isConfigured()) {
      throw new PaymentError(`The ${adapter.name} payment provider is not configured.`);
    }

    const intent = await adapter.createIntent(input);

    logger.info('payment intent created', {
      orderNumber: input.orderNumber,
      provider: adapter.name,
      status: intent.status,
    });

    return intent;
  }

  async verify(provider: PaymentProvider, reference: string) {
    return this.adapterFor(provider).verify(reference);
  }

  async refund(provider: PaymentProvider, reference: string, amount: number) {
    return this.adapterFor(provider).refund(reference, amount);
  }
}

export const paymentService = new PaymentService();