import { config } from '../config/env';

/*
 * Structured logger.
 *
 * A single redaction list is applied to every payload. Passwords, tokens and
 * provider secrets must never reach a log sink, so anything matching these keys
 * is replaced before serialisation rather than relying on call sites to
 * remember.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

/** Below this level everything is dropped in production. */
const MINIMUM_LEVEL: Level = 'info';

const LEVEL_ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const REDACTED = '[REDACTED]';

const SENSITIVE_KEYS = new Set([
  'password',
  'newpassword',
  'currentpassword',
  'confirmpassword',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'setcookie',
  'secret',
  'clientsecret',
  'appsecret',
  'apikey',
  'secretkey',
  'cardnumber',
  'cvv',
  'pin',
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[TRUNCATED]';
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1));

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(entry, depth + 1);
    }
    return output;
  }

  return value;
}

/** Test mode silences all output; enables faster CI runs and clean stdout. */
const isTest = config.isTest;

function write(level: Level, message: string, meta?: unknown) {
  if (isTest) return;
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MINIMUM_LEVEL] && config.isProduction) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta !== undefined ? { meta: redact(meta) } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};