import { UserRecord, UserRole } from '@fire-system/shared-types';
import { pool } from '../db/pool';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    isVerified: row.is_verified,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
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
      `INSERT INTO users (email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.email, input.passwordHash, input.fullName, input.phone ?? null, input.role],
    );
    return mapRow(rows[0]);
  },

  async markVerified(id: string): Promise<void> {
    await pool.query('UPDATE users SET is_verified = TRUE WHERE id = $1', [id]);
  },

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
  },
};
