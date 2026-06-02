import { Pool } from 'pg';
import { env } from '../config/env';

/** Shared PostgreSQL connection pool for the auth service. */
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10,
});

export async function closePool(): Promise<void> {
  await pool.end();
}
