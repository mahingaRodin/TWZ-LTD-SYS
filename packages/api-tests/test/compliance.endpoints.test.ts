import request from 'supertest';
import complianceApp from '../../../apps/backend/compliance-service/src/app';
import { adminToken } from './helpers/auth';

describe('Compliance Service endpoints', () => {
  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(complianceApp).get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('/api/reports', () => {
    it('rejects unauthenticated summary', async () => {
      const res = await request(complianceApp).get('/api/reports/summary');
      expect(res.status).toBe(401);
    });

    it('returns summary for authenticated user', async () => {
      const token = await adminToken();
      const res = await request(complianceApp)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalExtinguishers');
    });

    it('returns stock report', async () => {
      const token = await adminToken();
      const res = await request(complianceApp)
        .get('/api/reports/stock')
        .query({ period: 'monthly' })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns inspection breakdown', async () => {
      const token = await adminToken();
      const res = await request(complianceApp)
        .get('/api/reports/inspections')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('returns paginated expired report', async () => {
      const token = await adminToken();
      const res = await request(complianceApp)
        .get('/api/reports/expired')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('items');
    });

    it('returns paginated maintenance report', async () => {
      const token = await adminToken();
      const res = await request(complianceApp)
        .get('/api/reports/maintenance')
        .query({ page: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
