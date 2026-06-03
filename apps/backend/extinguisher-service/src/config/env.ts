import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  EXTINGUISHER_SERVICE_PORT: z.coerce.number().default(4003),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('admin'),
  DB_PASSWORD: z.string().default('admin123'),
  DB_NAME: z.string().default('fire_extinguisher_system'),

  // Shared secret so this service can verify tokens issued by the auth service.
  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret-change-me'),

  // For "notify relevant personnel" when inspections are scheduled.
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:4004'),

  /** Inspector portal base URL (used in assignment emails). */
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
