import { OtpPurpose } from '@fire-system/shared-types';
import { pool } from '../db/pool';

interface OtpRow {
  id: string;
  user_id: string;
  code_hash: string;
  purpose: OtpPurpose;
  expires_at: Date;
  consumed_at: Date | null;
}

export const otpRepository = {
  /** Invalidate any outstanding codes for this user/purpose, then store a new one. */
  async issue(
    userId: string,
    codeHash: string,
    purpose: OtpPurpose,
    expiresAt: Date,
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE otp_codes SET consumed_at = now() WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL',
        [userId, purpose],
      );
      await client.query(
        'INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [userId, codeHash, purpose, expiresAt],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /** Find the active (unconsumed, unexpired) code for a user/purpose. */
  async findActive(userId: string, purpose: OtpPurpose): Promise<OtpRow | null> {
    const { rows } = await pool.query<OtpRow>(
      `SELECT * FROM otp_codes
       WHERE user_id = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, purpose],
    );
    return rows[0] ?? null;
  },

  async consume(id: string): Promise<void> {
    await pool.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [id]);
  },
};
