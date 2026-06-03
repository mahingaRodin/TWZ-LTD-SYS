import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');

export const logMaintenanceSchema = z.object({
  extinguisherId: z.string().uuid(),
  actionTaken: z.string().trim().min(1).max(500),
  actionDate: isoDate,
  conditionNoted: z.string().max(1000).optional(),
});
