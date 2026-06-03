import { AdminAlertType } from '@fire-system/shared-types';
import { EXPIRY_CRITICAL_HOURS } from '@fire-system/shared-constants';
import { expiryCriticalEmailHtml } from '@fire-system/shared-utils';
import { pool } from '../../db/pool';
import { notify } from '../../utils/notifier';
import { logger } from '../../utils/logger';
import { alertRepository } from './alert.repository';

async function adminEmails(): Promise<string[]> {
  const { rows } = await pool.query<{ email: string }>(
    `SELECT email FROM users WHERE role = 'ADMIN'::user_role AND is_active = TRUE`,
  );
  return rows.map((r) => r.email);
}

/** Flag extinguishers expiring within 24h and notify admins. */
export async function scanExpiryCritical(): Promise<void> {
  const { rows } = await pool.query<{
    id: string;
    serial_number: string;
    location: string;
    expiry_date: string;
  }>(
    `SELECT id, serial_number, location, expiry_date::text AS expiry_date
     FROM extinguishers
     WHERE expiry_date <= (CURRENT_DATE + INTERVAL '1 day')
       AND status != 'DECOMMISSIONED'::extinguisher_status`,
  );

  await pool.query(
    `UPDATE extinguishers
     SET status = 'EXPIRED'::extinguisher_status
     WHERE expiry_date < CURRENT_DATE
       AND status NOT IN ('DECOMMISSIONED'::extinguisher_status, 'EXPIRED'::extinguisher_status)`,
  );

  const admins = await adminEmails();
  for (const ex of rows) {
    const exists = await alertRepository.hasOpenExpiryAlert(ex.id);
    if (exists) continue;

    await alertRepository.create({
      alertType: AdminAlertType.EXPIRY_CRITICAL,
      title: `CRITICAL: ${ex.serial_number} expiring soon`,
      message: `${ex.serial_number} at ${ex.location} expires ${ex.expiry_date}. Immediate action required.`,
      extinguisherId: ex.id,
    });

    const subject = `[CRITICAL] Extinguisher ${ex.serial_number} expiring within ${EXPIRY_CRITICAL_HOURS}h`;
    const plain = `${ex.serial_number} at ${ex.location} expires on ${ex.expiry_date}. Review the Admin Portal.`;
    const html = expiryCriticalEmailHtml(ex.serial_number, ex.location, ex.expiry_date);
    for (const email of admins) {
      await notify(email, subject, plain, html);
    }
  }
  if (rows.length) {
    logger.info(`Expiry scan: ${rows.length} critical unit(s) processed`);
  }
}

export function startExpiryScanner(): void {
  void scanExpiryCritical();
  setInterval(() => void scanExpiryCritical(), 60 * 60 * 1000);
}
