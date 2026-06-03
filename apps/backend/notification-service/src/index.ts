import app from './app';
import { env, smtpConfigured } from './config/env';
import { logger } from './utils/logger';

app.listen(env.NOTIFICATION_SERVICE_PORT, () => {
  logger.info(`Notification Service listening on port ${env.NOTIFICATION_SERVICE_PORT}`);
  if (!smtpConfigured) {
    logger.warn('SMTP not configured — emails will be logged, not delivered.');
  }
});
