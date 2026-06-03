import { AdminAlert, AdminAlertType } from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface AlertRow {
  id: string;
  alert_type: AdminAlertType;
  title: string;
  message: string;
  extinguisher_id: string | null;
  request_id: string | null;
  acknowledged_at: Date | null;
  created_at: Date;
}

function mapRow(row: AlertRow): AdminAlert {
  return {
    id: row.id,
    alertType: row.alert_type,
    title: row.title,
    message: row.message,
    extinguisherId: row.extinguisher_id,
    requestId: row.request_id,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

export const alertRepository = {
  async create(input: {
    alertType: AdminAlertType;
    title: string;
    message: string;
    extinguisherId?: string | null;
    requestId?: string | null;
  }): Promise<AdminAlert> {
    const { rows } = await pool.query<AlertRow>(
      `INSERT INTO admin_alerts (alert_type, title, message, extinguisher_id, request_id)
       VALUES ($1::admin_alert_type, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.alertType,
        input.title,
        input.message,
        input.extinguisherId ?? null,
        input.requestId ?? null,
      ],
    );
    return mapRow(rows[0]);
  },

  async listOpen(): Promise<AdminAlert[]> {
    const { rows } = await pool.query<AlertRow>(
      `SELECT * FROM admin_alerts WHERE acknowledged_at IS NULL ORDER BY created_at DESC`,
    );
    return rows.map(mapRow);
  },

  async acknowledge(id: string): Promise<AdminAlert | null> {
    const { rows } = await pool.query<AlertRow>(
      `UPDATE admin_alerts SET acknowledged_at = now() WHERE id = $1 AND acknowledged_at IS NULL RETURNING *`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async acknowledgeByRequestId(requestId: string): Promise<void> {
    await pool.query(
      `UPDATE admin_alerts SET acknowledged_at = now()
       WHERE request_id = $1 AND acknowledged_at IS NULL`,
      [requestId],
    );
  },

  async hasOpenExpiryAlert(extinguisherId: string): Promise<boolean> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM admin_alerts
       WHERE extinguisher_id = $1 AND alert_type = 'EXPIRY_CRITICAL'::admin_alert_type AND acknowledged_at IS NULL`,
      [extinguisherId],
    );
    return Number(rows[0].count) > 0;
  },
};
