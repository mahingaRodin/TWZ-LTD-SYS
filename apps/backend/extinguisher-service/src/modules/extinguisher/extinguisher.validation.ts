import { z } from 'zod';
import { ExtinguisherStatus, ExtinguisherType } from '@fire-system/shared-types';
import { serialNumberSchema } from '@fire-system/shared-utils';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in YYYY-MM-DD format');
const sizeSchema = z.enum(['2.5lbs', '5lbs', '9lbs', '12lbs']);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateExtinguisherDates(
  data: { installationDate?: string; expiryDate?: string },
  ctx: z.RefinementCtx,
): void {
  const { installationDate, expiryDate } = data;
  if (!expiryDate) return;

  const today = todayIso();
  if (expiryDate < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expiry date cannot be in the past',
      path: ['expiryDate'],
    });
  }

  if (installationDate && expiryDate < installationDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expiry date cannot be before the installation date',
      path: ['expiryDate'],
    });
  }
}

export const createExtinguisherSchema = z
  .object({
    serialNumber: serialNumberSchema,
    location: z.string().trim().min(1).max(200),
    type: z.nativeEnum(ExtinguisherType),
    size: sizeSchema,
    installationDate: isoDate,
    expiryDate: isoDate,
    status: z.nativeEnum(ExtinguisherStatus).optional(),
  })
  .superRefine(validateExtinguisherDates);

export const updateExtinguisherSchema = z
  .object({
    serialNumber: serialNumberSchema.optional(),
    location: z.string().trim().min(1).max(200).optional(),
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
    validateExtinguisherDates(data, ctx);
  });
