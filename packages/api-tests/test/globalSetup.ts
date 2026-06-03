import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const migrationsDir = path.resolve(__dirname, '../../../packages/db-migrations/migrations');

export default async function globalSetup(): Promise<void> {
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5433),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin123',
    database: process.env.DB_NAME ?? 'fire_extinguisher_test',
  });

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
  }

  await pool.end();
}
