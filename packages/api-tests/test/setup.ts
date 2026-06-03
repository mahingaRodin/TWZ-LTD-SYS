import { pool as authPool } from '../../../apps/backend/auth-service/src/db/pool';
import { closePool, truncateAll } from './helpers/db';

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closePool();
  await authPool.end();
});
