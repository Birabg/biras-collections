import { PrismaClient } from '@prisma/client';
import { config } from './env';

/*
 * A single PrismaClient per process. Cached on globalThis so `tsx watch` and
 * Vitest's module reloading do not open a new connection pool on every reload.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isProduction ? ['warn', 'error'] : ['warn', 'error'],
  });

if (!config.isProduction) globalForPrisma.prisma = prisma;