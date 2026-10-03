import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/*
 * Email abstraction.
 *
 * The API never depends on a concrete transport: it calls `emailService`, which
 * delegates to a provider chosen at boot. `console` prints the message, which is
 * how a developer obtains a real password-reset link in local development.
 * `smtp` delivers for real.
 *
 * No credentials are hardcoded; SMTP settings come from the environment.
 */

export interface WelcomeEmail {
  to: string;
  firstName: string;
}

export interface PasswordResetEmail {
  to: string;
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface OrderConfirmationEmail {
  to: string;
  firstName: string;
  orderNumber: string;
  total: number;
  itemCount: number;
}

export interface OrderStatusEmail {
  to: string;
  firstName: string;
  orderNumber: string;
  status: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

/* --------------------------------------------------------------- console --*/

class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';

  async send(message: EmailMessage) {
    const divider = '='.repeat(72);

    /*
     * Printed rather than sent, and clearly labelled, so nobody mistakes a
     * reset link from a dev machine for a delivered email.
     */
    console.log(
      [
        '',
        divider,
        `EMAIL (console provider — NOT delivered)`,
        divider,
        `To:      ${message.to}`,
        `From:    ${config.email.from}`,
        `Subject: ${message.subject}`,
        divider,
        message.text,
        divider,
        '',
      ].join('\n'),
    );
  }
}

/* ------------------------------------------------------------------- smtp --*/

/**
 * Real SMTP delivery via nodemailer.
 *
 * nodemailer is used rather than hand-rolling the protocol: STARTTLS upgrades,
 * implicit-TLS ports, AUTH variants and reply-code parsing are exactly the
 * places a hand-written client silently breaks, and none of it can be tested
 * without live credentials.
 */
class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';

  private transport: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transport) return this.transport;

    const { host, port, secure, user, password } = config.email.smtp;

    if (!host) {
      throw new Error('SMTP_HOST is required when EMAIL_PROVIDER=smtp');
    }

    this.transport = nodemailer.createTransport({
      host,
      // 465 is implicit TLS (secure from the first byte); 587 upgrades with
      // STARTTLS. nodemailer handles both when told which one it is.
      port: port ?? (secure ? 465 : 587),
      secure,
      auth: user && password ? { user, pass: password } : undefined,
      requireTLS: config.isProduction,
      tls: { rejectUnauthorized: true },
    });

    return this.transport;
  }

  async send(message: EmailMessage) {
    await this.getTransporter().sendMail({
      from: config.email.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

/* ---------------------------------------------------------------- service --*/

const providers: Record<string, EmailProvider> = {
  console: new ConsoleEmailProvider(),
  smtp: new SmtpEmailProvider(),
};

class EmailService {
  private provider: EmailProvider;

  constructor(providerName: string) {
    this.provider = providers[providerName] ?? providers.console!;
  }

  get providerName() {
    return this.provider.name;
  }

  /**
   * Delivery failure is logged, never thrown. A caller that has already
   * committed a registration or a password reset must not be made to look
   * failed because a mail server was unreachable.
   */
  private async dispatch(message: EmailMessage) {
    try {
      await this.provider.send(message);
      logger.info('email sent', { to: message.to, subject: message.subject, provider: this.provider.name });
    } catch (error) {
      logger.error('email delivery failed', { to: message.to, subject: message.subject, error });
    }
  }

  async sendWelcome({ to, firstName }: WelcomeEmail) {
    await this.dispatch({
      to,
      subject: 'Welcome to Bira\'s Collections',
      text: [
        `Hi ${firstName},`,
        '',
        'Your Bira\'s Collections account is ready.',
        '',
        'You can now save pieces to your wishlist, check out faster, and follow your orders from your account.',
        '',
        '— Bira\'s Collections',
      ].join('\n'),
    });
  }

  async sendPasswordReset({ to, firstName, resetUrl, expiresInMinutes }: PasswordResetEmail) {
    await this.dispatch({
      to,
      subject: 'Reset your Bira\'s Collections password',
      text: [
        `Hi ${firstName},`,
        '',
        'Use the link below to choose a new password. It works once and expires in ' +
          `${expiresInMinutes} minutes.`,
        '',
        resetUrl,
        '',
        'If you did not request this, you can ignore this email — nothing has changed.',
        '',
        '— Bira\'s Collections',
      ].join('\n'),
    });
  }

  async sendOrderConfirmation({ to, firstName, orderNumber, total, itemCount }: OrderConfirmationEmail) {
    await this.dispatch({
      to,
      subject: `Order ${orderNumber} confirmed`,
      text: [
        `Hi ${firstName},`,
        '',
        `We have received your order ${orderNumber}.`,
        '',
        `Items: ${itemCount}`,
        `Total: ${total} ETB`,
        '',
        'You can follow its progress from your account.',
        '',
        '— Bira\'s Collections',
      ].join('\n'),
    });
  }

  async sendOrderStatusUpdate({ to, firstName, orderNumber, status }: OrderStatusEmail) {
    await this.dispatch({
      to,
      subject: `Order ${orderNumber} — ${status.toLowerCase()}`,
      text: [
        `Hi ${firstName},`,
        '',
        `Order ${orderNumber} is now ${status.toLowerCase()}.`,
        '',
        'View the latest detail in your account.',
        '',
        '— Bira\'s Collections',
      ].join('\n'),
    });
  }

  async sendShippingNotification({ to, firstName, orderNumber }: OrderStatusEmail) {
    await this.dispatch({
      to,
      subject: `Order ${orderNumber} has shipped`,
      text: [
        `Hi ${firstName},`,
        '',
        `Order ${orderNumber} is on its way.`,
        '',
        '— Bira\'s Collections',
      ].join('\n'),
    });
  }
}

export const emailService = new EmailService(config.email.provider);