import { config as loadEnv } from 'dotenv';
import path from 'path';
import { z } from 'zod';

/*
 * Configuration is parsed once, at boot, and validated with Zod. A missing or
 * malformed variable crashes the process immediately rather than surfacing as a
 * confusing runtime error later — especially important for JWT secrets.
 */

loadEnv({ path: path.resolve(__dirname, '../../.env') });

const DEV_FALLBACK_SECRET = 'insecure-development-only-secret-do-not-use-in-production';

/** "15m", "7d", "900" (seconds) -> milliseconds. */
export function toMilliseconds(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(value.trim());

  if (!match) throw new Error(`Invalid duration: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * (multipliers[unit] ?? 1000);
}

/** Accepts "true"/"1"/"yes" as true; anything else is false. */
const booleanish = z
  .string()
  .transform((value) => ['true', '1', 'yes'].includes(value.toLowerCase()));

const optionalString = z.string().trim().optional().transform((v) => v || undefined);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  FRONTEND_URL: z.string().min(1).default('http://localhost:5173'),
  CORS_EXTRA_ORIGINS: z.string().default(''),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  COOKIE_SECURE: booleanish.default(false),

  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().default("Bira's Collections <no-reply@birascollections.com>"),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_SECURE: booleanish.default(false),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,

  PAYMENT_PROVIDER: z.enum(['dev', 'telebirr', 'cbe', 'chapa']).default('dev'),
  TELEBIRR_APP_ID: optionalString,
  TELEBIRR_APP_SECRET: optionalString,
  TELEBIRR_BASE_URL: z.string().default('https://api.telebirr.com'),
  CBE_APP_ID: optionalString,
  CBE_APP_SECRET: optionalString,
  CBE_BASE_URL: z.string().default('https://api.cbe.com.et'),
  CHAPA_SECRET_KEY: optionalString,

  IMAGE_STORAGE: z.enum(['url', 's3']).default('url'),
  S3_BUCKET: optionalString,
  S3_REGION: optionalString,
  S3_ENDPOINT: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_PUBLIC_URL: optionalString,

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  /**
   * Behind exactly one reverse proxy. This also changes which IP Express reports,
   * which is what the rate limiter keys on, so it is only switched on deliberately.
   */
  TRUST_PROXY: booleanish.default(false),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  // Fail fast: a server started with a missing secret is worse than no server.
  throw new Error(`Invalid environment configuration:\n${issues.join('\n')}`);
}

const env = parsed.data;

const isProduction = env.NODE_ENV === 'production';

if (isProduction) {
  const insecure: string[] = [];

  if (env.JWT_ACCESS_SECRET.includes(DEV_FALLBACK_SECRET)) insecure.push('JWT_ACCESS_SECRET');
  if (env.JWT_REFRESH_SECRET.includes(DEV_FALLBACK_SECRET)) insecure.push('JWT_REFRESH_SECRET');
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    insecure.push('JWT_REFRESH_SECRET (must differ from the access secret)');
  }
  if (!env.COOKIE_SECURE) insecure.push('COOKIE_SECURE (must be true in production)');

  if (insecure.length > 0) {
    throw new Error(`Refusing to start in production with insecure configuration:\n  - ${insecure.join('\n  - ')}`);
  }
}

/**
 * The refresh cookie. `sameSite: 'lax'` still sends it on top-level navigation,
 * which is all a refresh needs, while blocking cross-site POSTs — so a lax
 * setting is enough. 'none' would additionally require Secure and is only
 * needed for a genuinely cross-site frontend origin.
 */
const COOKIE_NAME = 'biras_rt';
const COOKIE_PATH = '/api/v1';

export const config = {
  env: env.NODE_ENV,
  isProduction,
  isTest: env.NODE_ENV === 'test',
  port: env.PORT,

  databaseUrl: env.DATABASE_URL,

  frontendUrl: env.FRONTEND_URL,
  corsOrigins: [
    env.FRONTEND_URL,
    ...env.CORS_EXTRA_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],

  jwt: {
    // The schema already rejects secrets shorter than 32 characters, so these are
    // guaranteed to be real values rather than a development placeholder.
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresMs: toMilliseconds(env.ACCESS_TOKEN_EXPIRES_IN),
    refreshExpiresMs: toMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN),
    issuer: 'biras-collections',
    audience: 'biras-web',
  },

  bcryptRounds: env.BCRYPT_ROUNDS,
  cookieSecure: env.COOKIE_SECURE,

  refreshCookie: {
    name: COOKIE_NAME,
    path: COOKIE_PATH,
    sameSite: 'lax' as const,
  },

  email: {
    provider: env.EMAIL_PROVIDER,
    from: env.EMAIL_FROM,
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.SMTP_FROM ?? env.EMAIL_FROM,
    },
  },

  payment: {
    provider: env.PAYMENT_PROVIDER,
    telebirr: {
      appId: env.TELEBIRR_APP_ID,
      appSecret: env.TELEBIRR_APP_SECRET,
      baseUrl: env.TELEBIRR_BASE_URL,
    },
    cbe: {
      appId: env.CBE_APP_ID,
      appSecret: env.CBE_APP_SECRET,
      baseUrl: env.CBE_BASE_URL,
    },
    chapa: { secretKey: env.CHAPA_SECRET_KEY },
  },

  imageStorage: {
    provider: env.IMAGE_STORAGE,
    s3: {
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      publicUrl: env.S3_PUBLIC_URL,
    },
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
  trustProxy: env.TRUST_PROXY,
};

export type Config = typeof config;