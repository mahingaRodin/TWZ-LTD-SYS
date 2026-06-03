import { MaintenanceLog } from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface MaintenanceRow {
  id: string;
  extinguisher_id: string;
  action_taken: string;
  action_date: string;
  condition_noted: string | null;
  performed_by: string | null;
  created_at: Date;
}

function mapRow(row: MaintenanceRow): MaintenanceLog {
  return {
    id: row.id,
    extinguisherId: row.extinguisher_id,
    actionTaken: row.action_taken,
    actionDate: row.action_date,
    conditionNoted: row.condition_noted,
    performedBy: row.performed_by,
    createdAt: row.created_at,
  };
}

const SELECT_COLS = `id, extinguisher_id, action_taken,
  action_date::text AS action_date, condition_noted, performed_by, created_at`;

export interface CreateMaintenanceInput {
  extinguisherId: string;
  actionTaken: string;
  actionDate: string;
  conditionNoted?: string | null;
  performedBy: string | null;
}

export const maintenanceRepository = {
  async create(input: CreateMaintenanceInput): Promise<MaintenanceLog> {
    const { rows } = await pool.query<MaintenanceRow>(
      `INSERT INTO maintenance_logs
         (extinguisher_id, action_taken, action_date, condition_noted, performed_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SELECT_COLS}`,
      [
        input.extinguisherId,
        input.actionTaken,
        input.actionDate,
        input.conditionNoted ?? null,
        input.performedBy,
      ],
    );
    return mapRow(rows[0]);
  },

  async list(
    filters: { extinguisherId?: string; performedBy?: string },
    limit: number,
    offset: number,
  ): Promise<{ items: MaintenanceLog[]; total: number }> {
    const conditions: string[] = [];
    const baseParams: unknown[] = [];
    let i = 1;

    if (filters.extinguisherId) {
      conditions.push(`extinguisher_id = $${i++}`);
      baseParams.push(filters.extinguisherId);
    }
    if (filters.performedBy) {
      conditions.push(`performed_by = $${i++}`);
      baseParams.push(filters.performedBy);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM maintenance_logs ${where}`,
      baseParams,
    );

    const params = [...baseParams, limit, offset];
    const { rows } = await pool.query<MaintenanceRow>(
      `SELECT ${SELECT_COLS} FROM maintenance_logs ${where}
       ORDER BY action_date DESC, created_at DESC
       LIMIT $${i++} OFFSET $${i}`,
      params,
    );
    return { items: rows.map(mapRow), total: Number(totalRes.rows[0].count) };
  },
};
