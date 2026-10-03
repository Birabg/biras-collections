import { createApp } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

/*
 * Server bootstrap.
 *
 * Startup order matters: validate the environment before listening, connect to
 * the database before accepting traffic, and register shutdown handlers so the
 * process never dies with open connections.
 */

async function main() {
  const app = createApp();

  try {
    // Fail fast rather than serving 503s on the first request.
    await prisma.$connect();
    logger.info('database connected');
  } catch (error) {
    logger.error('database connection failed', { error });
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info('server listening', {
      port: config.port,
      env: config.env,
      docs: `http://localhost:${config.port}/docs`,
    });
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);

    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('error during shutdown', { error });
        process.exit(1);
      }
    });

    // Do not wait forever for lingering keep-alive sockets.
    setTimeout(() => {
      logger.error('forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled promise rejection', { error: reason });
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', { error });
    shutdown('uncaughtException');
  });
}

main();