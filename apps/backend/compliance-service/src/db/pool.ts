import { createPool } from '@fire-system/shared-utils';

// Shared PostgreSQL pool for the compliance service (read-only reporting).
export const pool = createPool();

export async function closePool(): Promise<void> {
  await pool.end();
}
