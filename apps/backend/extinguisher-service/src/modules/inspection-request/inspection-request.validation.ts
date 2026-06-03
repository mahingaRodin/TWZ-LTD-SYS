import { z } from 'zod';
import { InspectionRequestStatus } from '@fire-system/shared-types';

export const createInspectionRequestSchema = z.object({
  extinguisherId: z.string().uuid(),
  preferredAt: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

export const reviewInspectionRequestSchema = z.object({
  status: z.enum([
    InspectionRequestStatus.REVIEWING,
    InspectionRequestStatus.DENIED,
    InspectionRequestStatus.APPROVED,
  ]),
  adminNotes: z.string().max(1000).optional(),
  inspectorId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date().optional(),
});
