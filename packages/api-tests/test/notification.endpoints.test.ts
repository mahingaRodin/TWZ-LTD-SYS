import request from 'supertest';
import notificationApp from '../../../apps/backend/notification-service/src/app';

describe('Notification Service endpoints', () => {
  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(notificationApp).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.service).toBe('notification-service');
    });
  });

  describe('POST /api/notifications/email', () => {
    it('accepts a valid email payload', async () => {
      const res = await request(notificationApp)
        .post('/api/notifications/email')
        .send({
          to: 'test@example.com',
          subject: 'Integration test',
          body: 'Hello from api-tests',
        });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('delivered');
    });

    it('rejects invalid email', async () => {
      const res = await request(notificationApp)
        .post('/api/notifications/email')
        .send({ to: 'not-email', subject: 'x', body: 'y' });
      expect(res.status).toBe(400);
    });
  });
});
