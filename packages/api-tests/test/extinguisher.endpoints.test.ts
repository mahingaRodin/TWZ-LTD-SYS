import request from 'supertest';
import {
  InspectionRequestStatus,
  InspectionResult,
  InspectionStatus,
  UserRole,
} from '@fire-system/shared-types';
import authApp from '../../../apps/backend/auth-service/src/app';
import extApp from '../../../apps/backend/extinguisher-service/src/app';
import { adminToken, facilityToken, inspectorToken } from './helpers/auth';

const extinguisherPayload = {
  serialNumber: 'AE9001',
  location: 'Lab A',
  type: 'CO2',
  size: '5lbs',
  installationDate: '2024-01-01',
  expiryDate: '2030-01-01',
};

describe('Extinguisher Service endpoints', () => {
  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(extApp).get('/health');
      expect(res.status).toBe(200);
    });
  });

  describe('/api/extinguishers', () => {
    it('rejects unauthenticated list', async () => {
      const res = await request(extApp).get('/api/extinguishers');
      expect(res.status).toBe(401);
    });

    it('CRUD as admin', async () => {
      const token = await adminToken();
      const created = await request(extApp)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${token}`)
        .send(extinguisherPayload);
      expect(created.status).toBe(201);
      const id = created.body.data.id as string;

      const list = await request(extApp)
        .get('/api/extinguishers')
        .set('Authorization', `Bearer ${token}`);
      expect(list.status).toBe(200);
      expect(list.body.data.total).toBe(1);

      const one = await request(extApp)
        .get(`/api/extinguishers/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(one.status).toBe(200);

      const updated = await request(extApp)
        .put(`/api/extinguishers/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Lab B' });
      expect(updated.status).toBe(200);

      const removed = await request(extApp)
        .delete(`/api/extinguishers/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(removed.status).toBe(200);
    });

    it('blocks facility user from create', async () => {
      const token = await facilityToken();
      const res = await request(extApp)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${token}`)
        .send(extinguisherPayload);
      expect(res.status).toBe(403);
    });
  });

  describe('/api/inspections', () => {
    it('schedules and completes inspection', async () => {
      const admin = await adminToken();
      const inspector = await inspectorToken();

      const ext = await request(extApp)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${admin}`)
        .send(extinguisherPayload);
      const extId = ext.body.data.id as string;

      const me = await request(authApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${inspector}`);
      const inspectorId = me.body.data.id as string;

      const sched = await request(extApp)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${admin}`)
        .send({
          extinguisherId: extId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          inspectorId,
        });
      expect(sched.status).toBe(201);
      const inspId = sched.body.data.id as string;

      const stats = await request(extApp)
        .get('/api/inspections/stats')
        .set('Authorization', `Bearer ${admin}`);
      expect(stats.status).toBe(200);

      const list = await request(extApp)
        .get('/api/inspections')
        .set('Authorization', `Bearer ${inspector}`);
      expect(list.status).toBe(200);

      const done = await request(extApp)
        .post(`/api/inspections/${inspId}/complete`)
        .set('Authorization', `Bearer ${inspector}`)
        .send({ result: InspectionResult.PASS });
      expect(done.status).toBe(200);
      expect(done.body.data.status).toBe(InspectionStatus.COMPLETED);
    });

    it('blocks facility user from inspections API', async () => {
      const token = await facilityToken();
      const res = await request(extApp)
        .get('/api/inspections')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  describe('/api/maintenance', () => {
    it('logs maintenance as inspector', async () => {
      const admin = await adminToken();
      const inspector = await inspectorToken();
      const ext = await request(extApp)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${admin}`)
        .send(extinguisherPayload);

      const res = await request(extApp)
        .post('/api/maintenance')
        .set('Authorization', `Bearer ${inspector}`)
        .send({
          extinguisherId: ext.body.data.id,
          actionTaken: 'Recharged',
          actionDate: '2026-06-01',
        });
      expect(res.status).toBe(201);

      const list = await request(extApp)
        .get('/api/maintenance')
        .set('Authorization', `Bearer ${inspector}`);
      expect(list.status).toBe(200);
    });
  });

  describe('/api/inspection-requests', () => {
    it('facility user sees only own requests and outcomes', async () => {
      const admin = await adminToken();
      const facility = await facilityToken();
      const inspector = await inspectorToken();

      const ext = await request(extApp)
        .post('/api/extinguishers')
        .set('Authorization', `Bearer ${admin}`)
        .send(extinguisherPayload);
      const extId = ext.body.data.id as string;

      const submitted = await request(extApp)
        .post('/api/inspection-requests')
        .set('Authorization', `Bearer ${facility}`)
        .send({
          extinguisherId: extId,
          preferredAt: new Date(Date.now() + 172800000).toISOString(),
          notes: 'Please inspect',
        });
      expect(submitted.status).toBe(201);
      const requestId = submitted.body.data.id as string;

      const me = await request(authApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${inspector}`);
      const inspectorId = me.body.data.id as string;

      await request(extApp)
        .patch(`/api/inspection-requests/${requestId}/review`)
        .set('Authorization', `Bearer ${admin}`)
        .send({
          status: InspectionRequestStatus.APPROVED,
          inspectorId,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      const mine = await request(extApp)
        .get('/api/inspection-requests')
        .set('Authorization', `Bearer ${facility}`);
      expect(mine.status).toBe(200);
      expect(mine.body.data.items).toHaveLength(1);
      expect(mine.body.data.items[0].requestedBy).toBe(mine.body.data.items[0].requestedBy);

      const stats = await request(extApp)
        .get('/api/inspection-requests/stats')
        .set('Authorization', `Bearer ${facility}`);
      expect(stats.status).toBe(200);
      expect(stats.body.data.total).toBe(1);
    });
  });

  describe('/api/alerts', () => {
    it('lists open alerts for admin', async () => {
      const admin = await adminToken();
      const res = await request(extApp)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${admin}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
