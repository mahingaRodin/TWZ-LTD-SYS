import { createAuth } from '@fire-system/shared-utils';
import { env } from './config/env';

// All authenticated users can read & download reports.
export const { authenticate } = createAuth(() => env.JWT_SECRET);
