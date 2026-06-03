import { Pool, PoolConfig } from 'pg';

/**
 * Build a PostgreSQL connection pool from the standard DB_* environment
 * variables. All services share one database (`fire_extinguisher_system`),
 * so they all use the same connection settings.
 */
export function createPool(overrides: Partial<PoolConfig> = {}): Pool {
  return new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin123',
    database: process.env.DB_NAME ?? 'fire_extinguisher_system',
    max: 10,
    ...overrides,
  });
}
