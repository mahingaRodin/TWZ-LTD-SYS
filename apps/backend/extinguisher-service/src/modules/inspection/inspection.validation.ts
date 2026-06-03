import { z } from 'zod';
import { InspectionResult } from '@fire-system/shared-types';

export const scheduleInspectionSchema = z.object({
  extinguisherId: z.string().uuid(),
  scheduledAt: z.coerce.date(), // accepts ISO date/datetime strings
  inspectorId: z.string().uuid().optional(), // personnel to notify/assign
  notes: z.string().max(1000).optional(),
});

// Inspectors log the outcome of a scheduled inspection.
export const completeInspectionSchema = z.object({
  result: z.nativeEnum(InspectionResult),
  notes: z.string().max(1000).optional(),
});
