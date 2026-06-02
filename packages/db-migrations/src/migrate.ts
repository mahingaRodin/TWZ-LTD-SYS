/**
 * Minimal forward-only SQL migration runner.
 *
 * Applies every `V*.sql` file in ./migrations (sorted by version number) that
 * has not already been recorded in the `schema_migrations` table. Each file is
 * applied inside a transaction, so a failing migration rolls back cleanly.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

function buildPool(): Pool {
  return new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin123',
    database: process.env.DB_NAME ?? 'fire_extinguisher_system',
  });
}

interface Migration {
  version: number;
  name: string;
  file: string;
  sql: string;
}

function loadMigrations(): Migration[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^V(\d+)__.+\.sql$/i.test(f))
    .map((file) => {
      const match = file.match(/^V(\d+)__(.+)\.sql$/i)!;
      return {
        version: Number(match[1]),
        name: match[2].replace(/_/g, ' '),
        file,
        sql: fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'),
      };
    })
    .sort((a, b) => a.version - b.version);
}

async function run(): Promise<void> {
  const pool = buildPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     INTEGER PRIMARY KEY,
        name        TEXT NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows } = await pool.query<{ version: number }>('SELECT version FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.version));

    const pending = loadMigrations().filter((m) => !applied.has(m.version));
    if (pending.length === 0) {
      console.log('✓ Database is up to date — no migrations to apply.');
      return;
    }

    for (const migration of pending) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
          migration.version,
          migration.name,
        ]);
        await client.query('COMMIT');
        console.log(`✓ Applied V${migration.version} — ${migration.name}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ Failed V${migration.version} — ${migration.name}`);
        throw err;
      } finally {
        client.release();
      }
    }

    console.log(`\n✓ Applied ${pending.length} migration(s) successfully.`);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
