import axios from 'axios';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Notify relevant personnel by delegating to the notification service.
 * Best-effort: a delivery failure is logged but never blocks the request
 * (e.g. an inspection is still scheduled even if the email can't be sent).
 */
export async function notify(
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
    logger.warn('Failed to send notification', {
      to,
      error: err instanceof Error ? err.message : err,
    });
  }
}
