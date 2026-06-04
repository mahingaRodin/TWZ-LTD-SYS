import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { closePool } from './db/pool';
import { startExpiryScanner } from './modules/alerts/expiryScanner';
import { startInspectionDueScanner } from './modules/alerts/inspectionDueScanner';

const server = app.listen(env.EXTINGUISHER_SERVICE_PORT, () => {
  logger.info(`Extinguisher Service listening on port ${env.EXTINGUISHER_SERVICE_PORT}`);
  startExpiryScanner();
  startInspectionDueScanner();
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
