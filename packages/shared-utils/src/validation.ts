import { z } from 'zod';
import { SERIAL_NUMBER_PATTERN } from '@fire-system/shared-constants';

export const serialNumberSchema = z
  .string()
  .trim()
  .regex(SERIAL_NUMBER_PATTERN, 'Serial number must match format AE123 (AE followed by digits)');
