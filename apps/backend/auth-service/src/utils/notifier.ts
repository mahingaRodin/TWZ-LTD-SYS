import axios from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string,
): Promise<void> {
  try {
    await axios.post(
      `${env.NOTIFICATION_SERVICE_URL}/api/notifications/email`,
      { to, subject, body, html },
      { timeout: 5000 },
    );
  } catch (err) {
    logger.warn('Failed to send email via notification service', {
      to,
      error: err instanceof Error ? err.message : err,
    });
  }
}
