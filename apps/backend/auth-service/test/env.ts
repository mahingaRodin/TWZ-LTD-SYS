// Force a test configuration before config/env.ts (and dotenv) load.
// dotenv does not override variables that are already set, so these win.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.JWT_EXPIRY = '15m';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_USER = process.env.DB_USER ?? 'admin';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'admin123';
// Use a dedicated database so tests never touch development data.
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'fire_extinguisher_test';
