import { Inspection, InspectionResult, InspectionStatus } from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface InspectionRow {
  id: string;
  extinguisher_id: string;
  scheduled_at: Date;
  inspector_id: string | null;
  status: InspectionStatus;
  result: InspectionResult | null;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: InspectionRow): Inspection {
  return {
    id: row.id,
    extinguisherId: row.extinguisher_id,
    scheduledAt: row.scheduled_at,
    inspectorId: row.inspector_id,
    status: row.status,
    result: row.result,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateInspectionInput {
  extinguisherId: string;
  scheduledAt: Date;
  inspectorId?: string | null;
  notes?: string | null;
  createdBy: string | null;
}

export interface InspectionListFilters {
  extinguisherId?: string;
  inspectorId?: string;
  status?: InspectionStatus;
  result?: InspectionResult;
  limit: number;
  offset: number;
}

export interface InspectionStats {
  ongoing: number;
  done: number;
  passed: number;
  failed: number;
  cancelled: number;
}

export const inspectionRepository = {
  async create(input: CreateInspectionInput): Promise<Inspection> {
    const { rows } = await pool.query<InspectionRow>(
      `INSERT INTO inspections (extinguisher_id, scheduled_at, inspector_id, notes, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        input.extinguisherId,
        input.scheduledAt,
        input.inspectorId ?? null,
        input.notes ?? null,
        input.createdBy,
      ],
    );
    return mapRow(rows[0]);
  },

  async findById(id: string): Promise<Inspection | null> {
    const { rows } = await pool.query<InspectionRow>('SELECT * FROM inspections WHERE id = $1', [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async list(filters: InspectionListFilters): Promise<{ items: Inspection[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.extinguisherId) {
      params.push(filters.extinguisherId);
      where.push(`extinguisher_id = $${params.length}`);
    }
    if (filters.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}::inspection_status`);
    }
    if (filters.inspectorId) {
      params.push(filters.inspectorId);
      where.push(`inspector_id = $${params.length}`);
    }
    if (filters.result) {
      params.push(filters.result);
      where.push(`result = $${params.length}::inspection_result`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM inspections ${whereSql}`,
      params,
    );

    params.push(filters.limit, filters.offset);
    const { rows } = await pool.query<InspectionRow>(
      `SELECT * FROM inspections ${whereSql}
       ORDER BY scheduled_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items: rows.map(mapRow), total: Number(totalRes.rows[0].count) };
  },

  async complete(id: string, result: InspectionResult, notes?: string | null): Promise<Inspection | null> {
    const { rows } = await pool.query<InspectionRow>(
      `UPDATE inspections
       SET status = 'COMPLETED'::inspection_status, result = $2::inspection_result, notes = COALESCE($3, notes)
       WHERE id = $1 AND status = 'SCHEDULED'
       RETURNING *`,
      [id, result, notes ?? null],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async countScheduledForExtinguisher(extinguisherId: string): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM inspections
       WHERE extinguisher_id = $1 AND status = 'SCHEDULED'::inspection_status`,
      [extinguisherId],
    );
    return Number(rows[0].count);
  },

  async cancel(id: string): Promise<Inspection | null> {
    const { rows } = await pool.query<InspectionRow>(
      `UPDATE inspections SET status = 'CANCELLED'
       WHERE id = $1 AND status = 'SCHEDULED'
       RETURNING *`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async stats(inspectorId?: string): Promise<InspectionStats> {
    const baseParams: unknown[] = [];
    let inspectorClause = '';
    if (inspectorId) {
      baseParams.push(inspectorId);
      inspectorClause = ` AND inspector_id = $${baseParams.length}`;
    }

    const statusRes = await pool.query<{ status: InspectionStatus; count: string }>(
      `SELECT status, COUNT(*)::int AS count FROM inspections
       WHERE 1=1${inspectorClause}
       GROUP BY status`,
      baseParams,
    );

    const resultParams = [...baseParams];
    const resultRes = await pool.query<{ result: InspectionResult; count: string }>(
      `SELECT result, COUNT(*)::int AS count FROM inspections
       WHERE status = 'COMPLETED'::inspection_status
         AND result IS NOT NULL${inspectorClause}
       GROUP BY result`,
      resultParams,
    );

    const byStatus = Object.fromEntries(
      statusRes.rows.map((r) => [r.status, Number(r.count)]),
    ) as Partial<Record<InspectionStatus, number>>;
    const byResult = Object.fromEntries(
      resultRes.rows.map((r) => [r.result, Number(r.count)]),
    ) as Partial<Record<InspectionResult, number>>;

    return {
      ongoing: byStatus.SCHEDULED ?? 0,
      done: byStatus.COMPLETED ?? 0,
      passed: byResult.PASS ?? 0,
      failed: byResult.FAIL ?? 0,
      cancelled: byStatus.CANCELLED ?? 0,
    };
  },

  /** Look up a user's contact details (shared DB) to notify personnel. */
  async findUserContact(userId: string): Promise<{ email: string; firstName: string } | null> {
    const { rows } = await pool.query<{ email: string; first_name: string }>(
      'SELECT email, first_name FROM users WHERE id = $1',
      [userId],
    );
    return rows[0] ? { email: rows[0].email, firstName: rows[0].first_name } : null;
  },
};
