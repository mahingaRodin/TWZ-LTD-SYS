import { pool } from '../../db/pool';

export type StockPeriod = 'daily' | 'monthly' | 'yearly';

const PERIOD_TRUNC: Record<StockPeriod, string> = {
  daily: 'day',
  monthly: 'month',
  yearly: 'year',
};

export interface CountByKey {
  key: string;
  count: number;
}

export const reportRepository = {
  /** Total extinguishers currently registered. */
  async totalExtinguishers(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM extinguishers',
    );
    return Number(rows[0].count);
  },

  /** Grouped counts of extinguishers by a given column (status / type). */
  async countBy(column: 'status' | 'type'): Promise<CountByKey[]> {
    const { rows } = await pool.query<{ key: string; count: string }>(
      `SELECT ${column} AS key, COUNT(*)::int AS count
       FROM extinguishers GROUP BY ${column} ORDER BY ${column}`,
    );
    return rows.map((r) => ({ key: r.key, count: Number(r.count) }));
  },

  /** Count of extinguishers labeled EXPIRED. */
  async expiredCount(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM extinguishers
       WHERE status = 'EXPIRED'::extinguisher_status`,
    );
    return Number(rows[0].count);
  },

  /** Inspection counts grouped by status. */
  async inspectionsByStatus(): Promise<CountByKey[]> {
    const { rows } = await pool.query<{ key: string; count: string }>(
      `SELECT status AS key, COUNT(*)::int AS count
       FROM inspections GROUP BY status ORDER BY status`,
    );
    return rows.map((r) => ({ key: r.key, count: Number(r.count) }));
  },

  /** Number of extinguishers registered per day/month/year (stock intake). */
  async stockByPeriod(period: StockPeriod): Promise<CountByKey[]> {
    const unit = PERIOD_TRUNC[period];
    const { rows } = await pool.query<{ bucket: string; count: string }>(
      `SELECT to_char(date_trunc('${unit}', created_at), 'YYYY-MM-DD') AS bucket,
              COUNT(*)::int AS count
       FROM extinguishers
       GROUP BY 1 ORDER BY 1`,
    );
    return rows.map((r) => ({ key: r.bucket, count: Number(r.count) }));
  },

  /** List of expired extinguishers (paginated). */
  async expiredList(
    limit: number,
    offset: number,
  ): Promise<{
    items: Array<{
      serialNumber: string;
      location: string;
      type: string;
      expiryDate: string;
      status: string;
    }>;
    total: number;
  }> {
    const totalRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM extinguishers
       WHERE status = 'EXPIRED'::extinguisher_status`,
    );
    const { rows } = await pool.query<{
      serial_number: string;
      location: string;
      type: string;
      expiry_date: string;
      status: string;
    }>(
      `SELECT serial_number, location, type, expiry_date::text AS expiry_date, status
       FROM extinguishers WHERE status = 'EXPIRED'::extinguisher_status
       ORDER BY expiry_date ASC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return {
      items: rows.map((r) => ({
        serialNumber: r.serial_number,
        location: r.location,
        type: r.type,
        expiryDate: r.expiry_date,
        status: r.status,
      })),
      total: Number(totalRes.rows[0].count),
    };
  },

  /** Maintenance history joined with the extinguisher serial (paginated). */
  async maintenanceHistory(
    limit: number,
    offset: number,
  ): Promise<{
    items: Array<{
      serialNumber: string;
      actionTaken: string;
      actionDate: string;
      conditionNoted: string | null;
    }>;
    total: number;
  }> {
    const totalRes = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM maintenance_logs',
    );
    const { rows } = await pool.query<{
      serial_number: string;
      action_taken: string;
      action_date: string;
      condition_noted: string | null;
    }>(
      `SELECT e.serial_number, m.action_taken,
              m.action_date::text AS action_date, m.condition_noted
       FROM maintenance_logs m
       JOIN extinguishers e ON e.id = m.extinguisher_id
       ORDER BY m.action_date DESC, m.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return {
      items: rows.map((r) => ({
        serialNumber: r.serial_number,
        actionTaken: r.action_taken,
        actionDate: r.action_date,
        conditionNoted: r.condition_noted,
      })),
      total: Number(totalRes.rows[0].count),
    };
  },
};
