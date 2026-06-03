import { UserRecord, UserRole } from '@fire-system/shared-types';
import { pool } from '../db/pool';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isVerified: row.is_verified,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

export const userRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const { rows } = await pool.query<UserRow>(
      'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
      [email],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async create(input: CreateUserInput): Promise<UserRecord> {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, $5::user_role, $6)
       RETURNING *`,
      [
        input.firstName,
        input.lastName,
        input.email,
        input.passwordHash,
        input.role,
        input.mustChangePassword ?? false,
      ],
    );
    return mapRow(rows[0]);
  },

  async findAdmins(): Promise<UserRecord[]> {
    const { rows } = await pool.query<UserRow>(
      `SELECT * FROM users WHERE role = 'ADMIN'::user_role AND is_active = TRUE`,
    );
    return rows.map(mapRow);
  },

  async clearMustChangePassword(id: string): Promise<void> {
    await pool.query(
      'UPDATE users SET must_change_password = FALSE WHERE id = $1',
      [id],
    );
  },

  /** Update mutable profile fields; only provided fields are changed (COALESCE). */
  async updateProfile(id: string, input: UpdateProfileInput): Promise<UserRecord> {
    const { rows } = await pool.query<UserRow>(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name)
       WHERE id = $1
       RETURNING *`,
      [id, input.firstName ?? null, input.lastName ?? null],
    );
    return mapRow(rows[0]);
  },

  async markVerified(id: string): Promise<void> {
    await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [id]);
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [passwordHash, id],
    );
  },

  async list(filters: {
    role?: UserRole;
    limit: number;
    offset: number;
  }): Promise<{ items: UserRecord[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (filters.role) {
      conditions.push(`role = $${i++}::user_role`);
      params.push(filters.role);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM users ${where}`,
      params,
    );
    const { rows } = await pool.query<UserRow>(
      `SELECT * FROM users ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`,
      [...params, filters.limit, filters.offset],
    );
    return {
      items: rows.map(mapRow),
      total: Number(countRes.rows[0].count),
    };
  },

  async updateByAdmin(
    id: string,
    input: {
      firstName?: string;
      lastName?: string;
      email?: string;
      role?: UserRole;
      isActive?: boolean;
      isVerified?: boolean;
    },
  ): Promise<UserRecord> {
    const { rows } = await pool.query<UserRow>(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           email      = COALESCE($4, email),
           role       = COALESCE($5::user_role, role),
           is_active  = COALESCE($6, is_active),
           is_verified = COALESCE($7, is_verified)
       WHERE id = $1
       RETURNING *`,
      [
        id,
        input.firstName ?? null,
        input.lastName ?? null,
        input.email ?? null,
        input.role ?? null,
        input.isActive ?? null,
        input.isVerified ?? null,
      ],
    );
    if (!rows[0]) {
      throw new Error('User not found');
    }
    return mapRow(rows[0]);
  },

  async deleteById(id: string): Promise<boolean> {
    const { rowCount } = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role <> 'ADMIN'::user_role`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};
