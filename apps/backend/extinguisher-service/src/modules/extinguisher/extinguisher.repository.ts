import {
  Extinguisher,
  ExtinguisherSize,
  ExtinguisherStatus,
  ExtinguisherType,
} from '@fire-system/shared-types';
import { pool } from '../../db/pool';

interface ExtinguisherRow {
  id: string;
  serial_number: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installation_date: string;
  expiry_date: string;
  status: ExtinguisherStatus;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: ExtinguisherRow): Extinguisher {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    location: row.location,
    type: row.type,
    size: row.size,
    installationDate: row.installation_date,
    expiryDate: row.expiry_date,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// DATE columns are cast to text so they come back as plain 'YYYY-MM-DD' strings
// (avoids timezone drift from the default node-postgres Date parser).
const SELECT_COLS = `id, serial_number, location, type, size,
  installation_date::text AS installation_date,
  expiry_date::text AS expiry_date,
  status, created_by, created_at, updated_at`;

export interface CreateExtinguisherInput {
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  status?: ExtinguisherStatus;
  createdBy: string | null;
}

export interface ListFilters {
  status?: ExtinguisherStatus;
  type?: ExtinguisherType;
  search?: string;
  limit: number;
  offset: number;
}

export const extinguisherRepository = {
  async create(input: CreateExtinguisherInput): Promise<Extinguisher> {
    const status = input.status ?? ExtinguisherStatus.ACTIVE;
    const { rows } = await pool.query<ExtinguisherRow>(
      `INSERT INTO extinguishers
         (serial_number, location, type, size, installation_date, expiry_date, status, created_by)
       VALUES ($1, $2, $3::extinguisher_type, $4::extinguisher_size, $5, $6, $7::extinguisher_status, $8)
       RETURNING ${SELECT_COLS}`,
      [
        input.serialNumber,
        input.location,
        input.type,
        input.size,
        input.installationDate,
        input.expiryDate,
        status,
        input.createdBy,
      ],
    );
    return mapRow(rows[0]);
  },

  async findById(id: string): Promise<Extinguisher | null> {
    const { rows } = await pool.query<ExtinguisherRow>(
      `SELECT ${SELECT_COLS} FROM extinguishers WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findBySerial(serialNumber: string): Promise<Extinguisher | null> {
    const { rows } = await pool.query<ExtinguisherRow>(
      `SELECT ${SELECT_COLS} FROM extinguishers WHERE lower(serial_number) = lower($1)`,
      [serialNumber],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  /** List with optional filters + pagination. Returns the page and total count. */
  async list(filters: ListFilters): Promise<{ items: Extinguisher[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
      params.push(filters.status);
      where.push(`status = $${params.length}::extinguisher_status`);
    }
    if (filters.type) {
      params.push(filters.type);
      where.push(`type = $${params.length}::extinguisher_type`);
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      where.push(`(serial_number ILIKE $${params.length} OR location ILIKE $${params.length})`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM extinguishers ${whereSql}`,
      params,
    );

    params.push(filters.limit, filters.offset);
    const { rows } = await pool.query<ExtinguisherRow>(
      `SELECT ${SELECT_COLS} FROM extinguishers ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return { items: rows.map(mapRow), total: Number(totalRes.rows[0].count) };
  },

  async update(id: string, input: Partial<CreateExtinguisherInput>): Promise<Extinguisher | null> {
    const { rows } = await pool.query<ExtinguisherRow>(
      `UPDATE extinguishers SET
         serial_number     = COALESCE($2, serial_number),
         location          = COALESCE($3, location),
         type              = COALESCE($4::extinguisher_type, type),
         size              = COALESCE($5::extinguisher_size, size),
         installation_date = COALESCE($6, installation_date),
         expiry_date       = COALESCE($7, expiry_date),
         status            = COALESCE($8::extinguisher_status, status)
       WHERE id = $1
       RETURNING ${SELECT_COLS}`,
      [
        id,
        input.serialNumber ?? null,
        input.location ?? null,
        input.type ?? null,
        input.size ?? null,
        input.installationDate ?? null,
        input.expiryDate ?? null,
        input.status ?? null,
      ],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { rowCount } = await pool.query('DELETE FROM extinguishers WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
