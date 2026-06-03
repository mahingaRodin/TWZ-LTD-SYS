import { createPool } from '@fire-system/shared-utils';

// Shared PostgreSQL pool for the auth service (built from DB_* env vars).
export const pool = createPool();

export async function closePool(): Promise<void> {
  await pool.end();
}
