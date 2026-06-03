/**
 * Seeds the default TWZ Ltd admin account (idempotent).
 * Run after migrations: pnpm run db:seed
 */
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const ADMIN = {
  firstName: 'Rodin',
  lastName: 'Admin',
  email: 'agressive.one04@gmail.com',
  password: 'Rodin!132',
  role: 'ADMIN',
};

function buildPool(): Pool {
  return new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'admin',
    password: process.env.DB_PASSWORD ?? 'admin123',
    database: process.env.DB_NAME ?? 'fire_extinguisher_system',
  });
}

async function run(): Promise<void> {
  const pool = buildPool();
  try {
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);
    const { rowCount } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5::user_role, TRUE, TRUE)
       ON CONFLICT ((lower(email))) DO UPDATE SET
         first_name    = EXCLUDED.first_name,
         last_name     = EXCLUDED.last_name,
         password_hash = EXCLUDED.password_hash,
         role          = EXCLUDED.role,
         is_verified   = TRUE,
         is_active     = TRUE,
         must_change_password = FALSE`,
      [ADMIN.firstName, ADMIN.lastName, ADMIN.email, passwordHash, ADMIN.role],
    );
    console.log(
      rowCount === 1
        ? `✓ Admin seeded: ${ADMIN.email} (${ADMIN.role})`
        : `✓ Admin updated: ${ADMIN.email} (${ADMIN.role})`,
    );
    console.log('  Login with the configured password after migrations.');
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
