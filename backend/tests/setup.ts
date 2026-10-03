/*
 * Test bootstrap.
 *
 * `src/config/env.ts` validates and freezes the configuration the first time
 * anything imports it, and throws on a missing JWT secret or a placeholder
 * value. These variables are set before that module is ever loaded (setupFiles run
 * before test modules) so unit tests can import services without a real `.env`.
 *
 * Integration tests that need PostgreSQL use DATABASE_URL_TEST, which defaults to
 * DATABASE_URL. They are skipped when neither is present rather than failing, so
 * `npm test` stays useful on a machine with no database.
 */

const TEST_JWT_ACCESS = 'test-access-secret-at-least-32-characters-long';
const TEST_JWT_REFRESH = 'test-refresh-secret-at-least-32-characters-long';

process.env.NODE_ENV ??= 'test';
process.env.JWT_ACCESS_SECRET ??= TEST_JWT_ACCESS;
process.env.JWT_REFRESH_SECRET ??= TEST_JWT_REFRESH;

// Cheap on purpose: bcrypt cost is pure overhead for fixtures and slows the
// suite by seconds. Never lower this outside tests.
process.env.BCRYPT_ROUNDS ??= '4';

process.env.DATABASE_URL_TEST ??= process.env.DATABASE_URL;

/**
 * `src/config/env.ts` requires DATABASE_URL, so a unit test that imports a
 * service still needs the variable to be present. When there is no real database
 * the value is a syntactically valid placeholder that is never dialled — Prisma
 * only connects when a query runs, and the suites that do are gated on
 * `hasDatabase` below.
 */
process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/biras_test?schema=public';

/** True when a real database URL is available for integration tests. */
export const hasDatabase = Boolean(process.env.DATABASE_URL_TEST);