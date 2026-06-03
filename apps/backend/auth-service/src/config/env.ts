import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the repo-root .env (all services share one env file in this monorepo).
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SERVICE_PORT: z.coerce.number().default(4001),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('admin'),
  DB_PASSWORD: z.string().default('admin123'),
  DB_NAME: z.string().default('fire_extinguisher_system'),

  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret-change-me'),
  JWT_EXPIRY: z.string().default('15m'),

  // Used to deliver OTP / verification emails via the notification service.
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4004'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
