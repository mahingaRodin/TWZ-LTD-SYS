import { InspectorAlert, InspectorAlertType } from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface InspectorAlertRow {
  id: string;
  alert_type: InspectorAlertType;
  title: string;
  message: string;
  inspection_id: string;
  inspector_id: string;
  acknowledged_at: Date | null;
  created_at: Date;
}

function mapRow(row: InspectorAlertRow): InspectorAlert {
  return {
    id: row.id,
    alertType: row.alert_type,
    title: row.title,
    message: row.message,
    inspectionId: row.inspection_id,
    inspectorId: row.inspector_id,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

export const inspectorAlertRepository = {
  async create(input: {
    title: string;
    message: string;
    inspectionId: string;
    inspectorId: string;
  }): Promise<InspectorAlert> {
    const { rows } = await pool.query<InspectorAlertRow>(
      `INSERT INTO inspector_alerts (alert_type, title, message, inspection_id, inspector_id)
       VALUES ('INSPECTION_DUE_SOON'::inspector_alert_type, $1, $2, $3, $4)
       RETURNING *`,
      [input.title, input.message, input.inspectionId, input.inspectorId],
    );
    return mapRow(rows[0]);
  },

  async listOpenForInspector(inspectorId: string): Promise<InspectorAlert[]> {
    const { rows } = await pool.query<InspectorAlertRow>(
      `SELECT * FROM inspector_alerts
       WHERE inspector_id = $1 AND acknowledged_at IS NULL
       ORDER BY created_at DESC`,
      [inspectorId],
    );
    return rows.map(mapRow);
  },

  async hasOpenForInspection(inspectionId: string): Promise<boolean> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM inspector_alerts
       WHERE inspection_id = $1 AND acknowledged_at IS NULL`,
      [inspectionId],
    );
    return Number(rows[0].count) > 0;
  },

  /** Clear alerts once an inspection has an outcome (completed/cancelled). */
  async resolveByInspectionId(inspectionId: string): Promise<void> {
    await pool.query(
      `UPDATE inspector_alerts SET acknowledged_at = now()
       WHERE inspection_id = $1 AND acknowledged_at IS NULL`,
      [inspectionId],
    );
  },

  /** Drop stale open alerts when the inspection is no longer due. */
  async resolveStale(): Promise<void> {
    await pool.query(
      `UPDATE inspector_alerts ia SET acknowledged_at = now()
       FROM inspections i
       WHERE ia.inspection_id = i.id
         AND ia.acknowledged_at IS NULL
         AND (i.status <> 'SCHEDULED'::inspection_status OR i.result IS NOT NULL)`,
    );
  },
};
