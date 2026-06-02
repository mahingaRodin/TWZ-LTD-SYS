import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { closePool } from './db/pool';

const server = app.listen(env.AUTH_SERVICE_PORT, () => {
  logger.info(`Auth Service listening on port ${env.AUTH_SERVICE_PORT}`);
});

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
