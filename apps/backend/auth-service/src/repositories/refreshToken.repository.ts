import { pool } from '../db/pool';

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
}

export const refreshTokenRepository = {
  async store(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt],
    );
  },

  /** Find an active (unrevoked, unexpired) token by its hash. */
  async findActiveByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
    const { rows } = await pool.query<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
       LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  async revoke(tokenHash: string): Promise<void> {
    await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [
      tokenHash,
    ]);
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId],
    );
  },
};
