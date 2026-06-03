import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NOTIFICATION_SERVICE_PORT: z.coerce.number().default(4004),

  // SMTP is optional: if not configured, emails are logged instead of sent.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@fire-system.com'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Treat the .env.example placeholder as "not configured".
export const smtpConfigured =
  !!env.SMTP_HOST && !!env.SMTP_USER && env.SMTP_USER !== 'your-email@gmail.com';
