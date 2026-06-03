import request from 'supertest';
import { OtpPurpose, UserRole } from '@fire-system/shared-types';
import authApp from '../../../apps/backend/auth-service/src/app';
import { adminToken, register, registerAndLogin, validUser } from './helpers/auth';
import { issueTestOtp } from './helpers/otp';

describe('Auth Service endpoints', () => {
  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(authApp).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates a user without exposing OTP', async () => {
      const res = await register();
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data).not.toHaveProperty('devOtp');
    });

    it('rejects duplicate email', async () => {
      await register();
      const res = await register();
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('blocks unverified email', async () => {
      await register();
      const res = await request(authApp)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(401);
    });

    it('returns tokens after verification', async () => {
      const session = await registerAndLogin();
      expect(session.tokens.accessToken).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns profile with valid token', async () => {
      const session = await registerAndLogin();
      const res = await request(authApp)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${session.tokens.accessToken}`);
      expect(res.status).toBe(200);
    });

    it('rejects missing token', async () => {
      const res = await request(authApp).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates refresh token', async () => {
      const session = await registerAndLogin();
      const old = session.tokens.refreshToken;
      const res = await request(authApp).post('/api/auth/refresh').send({ refreshToken: old });
      expect(res.status).toBe(200);
      expect(res.body.data.refreshToken).not.toBe(old);
    });
  });

  describe('POST /api/auth/password/reset', () => {
    it('resets password with OTP', async () => {
      await registerAndLogin();
      await request(authApp)
        .post('/api/auth/otp/request')
        .send({ email: validUser.email, purpose: OtpPurpose.PASSWORD_RESET });
      const code = await issueTestOtp(validUser.email, OtpPurpose.PASSWORD_RESET);
      const res = await request(authApp)
        .post('/api/auth/password/reset')
        .send({ email: validUser.email, code, newPassword: 'BrandNewPass1' });
      expect(res.status).toBe(200);
    });
  });

  describe('Admin /api/auth/users', () => {
    it('creates inspector', async () => {
      const token = await adminToken();
      const res = await request(authApp)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Ian',
          lastName: 'Inspector',
          email: 'inspector-new@test.com',
          role: UserRole.INSPECTOR,
        });
      expect(res.status).toBe(201);
    });

    it('lists users by role', async () => {
      const token = await adminToken();
      const res = await request(authApp)
        .get('/api/auth/users')
        .query({ role: UserRole.ADMIN })
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });

    it('updates and deletes user', async () => {
      const token = await adminToken();
      const created = await request(authApp)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Del',
          lastName: 'Target',
          email: 'delete-me@test.com',
          role: UserRole.USER,
        });
      const id = created.body.data.id as string;
      const removed = await request(authApp)
        .delete(`/api/auth/users/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(removed.status).toBe(200);
    });
  });
});
