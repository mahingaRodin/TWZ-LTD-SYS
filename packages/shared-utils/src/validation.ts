import { z } from 'zod';
import { SERIAL_NUMBER_PATTERN } from '@fire-system/shared-constants';
import { ExtinguisherStatus } from '@fire-system/shared-types';

export const serialNumberSchema = z
  .string()
  .trim()
  .regex(SERIAL_NUMBER_PATTERN, 'Serial number must match format AE123 (AE followed by digits)');

export const extinguisherLocationSchema = z
  .string()
  .trim()
  .min(2, 'Location must be at least 2 characters')
  .max(200, 'Location must be at most 200 characters');

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateExtinguisherDateFields(
  data: {
    installationDate?: string;
    expiryDate?: string;
    status?: ExtinguisherStatus;
  },
  ctx: z.RefinementCtx,
): void {
  const { installationDate, expiryDate, status } = data;
  const today = todayIsoDate();

  if (installationDate) {
    if (installationDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Installation date cannot be in the future',
        path: ['installationDate'],
      });
    }
    const earliest = new Date();
    earliest.setFullYear(earliest.getFullYear() - 50);
    const earliestIso = earliest.toISOString().slice(0, 10);
    if (installationDate < earliestIso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Installation date is too far in the past',
        path: ['installationDate'],
      });
    }
  }

  if (expiryDate) {
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

  if (status && expiryDate) {
    if (status === ExtinguisherStatus.EXPIRED && expiryDate >= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Status cannot be EXPIRED while the expiry date is still in the future',
        path: ['status'],
      });
    }
    if (status === ExtinguisherStatus.ACTIVE && expiryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Status cannot be ACTIVE when the expiry date has passed',
        path: ['status'],
      });
    }
  }
}
