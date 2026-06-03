import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }
  return pool;
}

export async function truncateAll(): Promise<void> {
  await getPool().query(`
    TRUNCATE
      admin_alerts,
      inspection_requests,
      maintenance_logs,
      inspections,
      extinguishers,
      refresh_tokens,
      otp_codes,
      users
    RESTART IDENTITY CASCADE
  `);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
