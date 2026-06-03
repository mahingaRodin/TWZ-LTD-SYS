import { createAuth } from '@fire-system/shared-utils';
import { env } from './config/env';

// JWT auth + role guards for this service, bound to the shared JWT secret.
export const { authenticate, authorize } = createAuth(() => env.JWT_SECRET);
