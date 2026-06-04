import { INSPECTION_DUE_HOURS } from '@fire-system/shared-constants';
import { inspectionDueSoonEmailHtml } from '@fire-system/shared-utils';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { notify } from '../../utils/notifier';
import { logger } from '../../utils/logger';
import { inspectorAlertRepository } from './inspector-alert.repository';

interface DueRow {
  id: string;
  inspector_id: string;
  scheduled_at: Date;
  serial_number: string;
  location: string;
  inspector_email: string;
  inspector_first_name: string;
}

/** Notify inspectors when a scheduled visit is within 24h and still has no outcome. */
export async function scanInspectionDueSoon(): Promise<void> {
  await inspectorAlertRepository.resolveStale();

  const { rows } = await pool.query<DueRow>(
    `SELECT i.id, i.inspector_id, i.scheduled_at,
            e.serial_number, e.location,
            u.email AS inspector_email, u.first_name AS inspector_first_name
     FROM inspections i
     INNER JOIN extinguishers e ON e.id = i.extinguisher_id
     INNER JOIN users u ON u.id = i.inspector_id
     WHERE i.status = 'SCHEDULED'::inspection_status
       AND i.inspector_id IS NOT NULL
       AND i.result IS NULL
       AND i.scheduled_at <= (NOW() + INTERVAL '1 hour' * $1)`,
    [INSPECTION_DUE_HOURS],
  );

  const base = env.FRONTEND_URL.replace(/\/$/, '');

  for (const row of rows) {
    const exists = await inspectorAlertRepository.hasOpenForInspection(row.id);
    if (exists) continue;

    const scheduledLabel = row.scheduled_at.toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const overdue = row.scheduled_at.getTime() < Date.now();
    const title = overdue
      ? `OVERDUE: Inspection for ${row.serial_number}`
      : `Due soon: Inspection for ${row.serial_number}`;
    const message = overdue
      ? `${row.serial_number} at ${row.location} was scheduled for ${scheduledLabel}. Log pass/fail now.`
      : `${row.serial_number} at ${row.location} is due by ${scheduledLabel}. Less than ${INSPECTION_DUE_HOURS}h remaining.`;

    await inspectorAlertRepository.create({
      title,
      message,
      inspectionId: row.id,
      inspectorId: row.inspector_id,
    });

    const viewUrl = `${base}/app/inspector?focus=${row.id}`;
    const subject = overdue
      ? `[OVERDUE] Field inspection — ${row.serial_number}`
      : `[REMINDER] Field inspection due within ${INSPECTION_DUE_HOURS}h — ${row.serial_number}`;
    const plain = `${message}\n\nOpen your assignment: ${viewUrl}`;
    const html = inspectionDueSoonEmailHtml(
      row.inspector_first_name,
      row.serial_number,
      row.location,
      scheduledLabel,
      overdue,
      viewUrl,
    );
    await notify(row.inspector_email, subject, plain, html);
  }

  if (rows.length) {
    logger.info(`Inspection due scan: ${rows.length} assignment(s) checked`);
  }
}

export function startInspectionDueScanner(): void {
  void scanInspectionDueSoon();
  setInterval(() => void scanInspectionDueSoon(), 60 * 60 * 1000);
}
