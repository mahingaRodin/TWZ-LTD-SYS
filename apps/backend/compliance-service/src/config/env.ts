import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  COMPLIANCE_SERVICE_PORT: z.coerce.number().default(4005),

  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('admin'),
  DB_PASSWORD: z.string().default('admin123'),
  DB_NAME: z.string().default('fire_extinguisher_system'),

  // Shared secret so this service can verify tokens issued by the auth service.
  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret-change-me'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
