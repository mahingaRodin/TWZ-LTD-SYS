import { z } from 'zod';
import { ExtinguisherStatus, ExtinguisherType } from '@fire-system/shared-types';
import { serialNumberSchema } from '@fire-system/shared-utils';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');
const sizeSchema = z.enum(['2.5lbs', '5lbs', '9lbs', '12lbs']);

export const createExtinguisherSchema = z.object({
  serialNumber: serialNumberSchema,
  location: z.string().trim().min(1).max(200),
  type: z.nativeEnum(ExtinguisherType),
  size: sizeSchema,
  installationDate: isoDate,
  expiryDate: isoDate,
  status: z.nativeEnum(ExtinguisherStatus).optional(),
});

// Every field optional on update; the repository only changes provided fields.
export const updateExtinguisherSchema = createExtinguisherSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Provide at least one field to update' },
);
