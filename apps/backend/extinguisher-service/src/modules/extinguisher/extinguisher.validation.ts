import { z } from 'zod';
import { ExtinguisherStatus, ExtinguisherType } from '@fire-system/shared-types';
import {
  extinguisherLocationSchema,
  serialNumberSchema,
  validateExtinguisherDateFields,
} from '@fire-system/shared-utils';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');
const sizeSchema = z.enum(['2.5lbs', '5lbs', '9lbs', '12lbs']);

export const createExtinguisherSchema = z
  .object({
    serialNumber: serialNumberSchema,
    location: extinguisherLocationSchema,
    type: z.nativeEnum(ExtinguisherType),
    size: sizeSchema,
    installationDate: isoDate,
    expiryDate: isoDate,
    status: z.nativeEnum(ExtinguisherStatus).optional(),
  })
  .superRefine(validateExtinguisherDateFields);

export const updateExtinguisherSchema = z
  .object({
    serialNumber: serialNumberSchema.optional(),
    location: extinguisherLocationSchema.optional(),
    type: z.nativeEnum(ExtinguisherType).optional(),
    size: sizeSchema.optional(),
    installationDate: isoDate.optional(),
    expiryDate: isoDate.optional(),
    status: z.nativeEnum(ExtinguisherStatus).optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one field to update',
      });
    }
    validateExtinguisherDateFields(data, ctx);
  });
