import {
  InspectionRequest,
  InspectionRequestStatus,
  InspectionResult,
  InspectionStatus,
} from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface RequestRow {
  id: string;
  extinguisher_id: string;
  requested_by: string;
  preferred_at: Date;
  notes: string | null;
  status: InspectionRequestStatus;
  admin_notes: string | null;
  inspector_id: string | null;
  inspection_id: string | null;
  reviewed_by: string | null;
  created_at: Date;
  updated_at: Date;
  serial_number?: string;
  location?: string;
  requester_first?: string;
  requester_last?: string;
  inspection_status?: InspectionStatus | null;
  inspection_result?: InspectionResult | null;
  inspection_scheduled_at?: Date | null;
}

function mapRow(row: RequestRow): InspectionRequest {
  return {
    id: row.id,
    extinguisherId: row.extinguisher_id,
    requestedBy: row.requested_by,
    preferredAt: row.preferred_at,
    notes: row.notes,
    status: row.status,
    adminNotes: row.admin_notes,
    inspectorId: row.inspector_id,
    inspectionId: row.inspection_id,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serialNumber: row.serial_number,
    location: row.location,
    requesterName:
      row.requester_first && row.requester_last
        ? `${row.requester_first} ${row.requester_last}`
        : undefined,
    inspectionStatus: row.inspection_status ?? null,
    inspectionResult: row.inspection_result ?? null,
    inspectionScheduledAt: row.inspection_scheduled_at ?? null,
  };
}

const JOIN_COLS = `r.*, e.serial_number, e.location, u.first_name AS requester_first, u.last_name AS requester_last,
  i.status AS inspection_status, i.result AS inspection_result, i.scheduled_at AS inspection_scheduled_at`;

const FROM_JOIN = `FROM inspection_requests r
       JOIN extinguishers e ON e.id = r.extinguisher_id
       JOIN users u ON u.id = r.requested_by
       LEFT JOIN inspections i ON i.id = r.inspection_id`;

export const inspectionRequestRepository = {
  async create(input: {
    extinguisherId: string;
    requestedBy: string;
    preferredAt: Date;
    notes?: string | null;
  }): Promise<InspectionRequest> {
    const { rows } = await pool.query<RequestRow>(
      `INSERT INTO inspection_requests (extinguisher_id, requested_by, preferred_at, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [input.extinguisherId, input.requestedBy, input.preferredAt, input.notes ?? null],
    );
    return (await this.findById(rows[0].id))!;
  },

  async findById(id: string): Promise<InspectionRequest | null> {
    const { rows } = await pool.query<RequestRow>(
      `SELECT ${JOIN_COLS}
       ${FROM_JOIN}
       WHERE r.id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async list(filters: {
    status?: InspectionRequestStatus;
    requestedBy?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: InspectionRequest[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filters.status) {
      params.push(filters.status);
      where.push(`r.status = $${params.length}::inspection_request_status`);
    }
    if (filters.requestedBy) {
      params.push(filters.requestedBy);
      where.push(`r.requested_by = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM inspection_requests r ${whereSql}`,
      params,
    );

    params.push(filters.limit, filters.offset);
    const { rows } = await pool.query<RequestRow>(
      `SELECT ${JOIN_COLS}
       ${FROM_JOIN}
       ${whereSql}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { items: rows.map(mapRow), total: Number(countRes.rows[0].count) };
  },

  async stats(requestedBy?: string): Promise<{
    pending: number;
    reviewing: number;
    denied: number;
    approved: number;
    total: number;
  }> {
    const params: unknown[] = [];
    let where = '';
    if (requestedBy) {
      params.push(requestedBy);
      where = ` WHERE requested_by = $1`;
    }
    const { rows } = await pool.query<{ status: InspectionRequestStatus; count: string }>(
      `SELECT status, COUNT(*)::int AS count FROM inspection_requests${where} GROUP BY status`,
      params,
    );
    const byStatus = Object.fromEntries(
      rows.map((r) => [r.status, Number(r.count)]),
    ) as Partial<Record<InspectionRequestStatus, number>>;
    const pending = byStatus.PENDING ?? 0;
    const reviewing = byStatus.REVIEWING ?? 0;
    const denied = byStatus.DENIED ?? 0;
    const approved = byStatus.APPROVED ?? 0;
    return {
      pending,
      reviewing,
      denied,
      approved,
      total: pending + reviewing + denied + approved,
    };
  },

  async update(
    id: string,
    input: {
      status?: InspectionRequestStatus;
      adminNotes?: string | null;
      inspectorId?: string | null;
      inspectionId?: string | null;
      reviewedBy?: string | null;
    },
  ): Promise<InspectionRequest | null> {
    const { rows } = await pool.query<{ id: string }>(
      `UPDATE inspection_requests SET
         status = COALESCE($2::inspection_request_status, status),
         admin_notes = COALESCE($3, admin_notes),
         inspector_id = COALESCE($4, inspector_id),
         inspection_id = COALESCE($5, inspection_id),
         reviewed_by = COALESCE($6, reviewed_by)
       WHERE id = $1
       RETURNING id`,
      [
        id,
        input.status ?? null,
        input.adminNotes ?? null,
        input.inspectorId ?? null,
        input.inspectionId ?? null,
        input.reviewedBy ?? null,
      ],
    );
    if (!rows[0]) return null;
    return this.findById(rows[0].id);
  },
};
