import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../src/app';
import { pool } from '../src/db/pool';

const MIGRATION = path.resolve(
  __dirname,
  '../../../../packages/db-migrations/migrations/V1__Init_Database.sql',
);

const validUser = {
  email: 'alice@example.com',
  password: 'Sup3rSecret!',
  fullName: 'Alice Tester',
  phone: '+250788000000',
};

beforeAll(async () => {
  // Apply the schema (idempotent) so the suite is self-contained.
  await pool.query(fs.readFileSync(MIGRATION, 'utf8'));
});

beforeEach(async () => {
  await pool.query('TRUNCATE users, otp_codes, refresh_tokens RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});

async function register(overrides: Partial<typeof validUser> = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

describe('Auth Service', () => {
  describe('GET /health', () => {
    it('returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ok');
    });
  });

  describe('POST /api/auth/register', () => {
    it('creates a user and returns tokens', async () => {
      const res = await register();
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(validUser.email);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      // OTP is surfaced outside production for testability.
      expect(res.body.data.devOtp).toMatch(/^\d{6}$/);
    });

    it('rejects a duplicate email with 409', async () => {
      await register();
      const res = await register();
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejects an invalid payload with 400', async () => {
      const res = await register({ email: 'not-an-email', password: 'short' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      await register();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('rejects wrong password with 401', async () => {
      await register();
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the profile for a valid token', async () => {
      const { body } = await register();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${body.data.tokens.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(validUser.email);
    });

    it('rejects a missing token with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects a garbage token with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates the refresh token and invalidates the old one', async () => {
      const { body } = await register();
      const oldRefresh = body.data.tokens.refreshToken;

      const rotated = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh });
      expect(rotated.status).toBe(200);
      expect(rotated.body.data.refreshToken).toBeDefined();
      expect(rotated.body.data.refreshToken).not.toBe(oldRefresh);

      // The old token must no longer work.
      const reused = await request(app).post('/api/auth/refresh').send({ refreshToken: oldRefresh });
      expect(reused.status).toBe(401);
    });
  });

  describe('OTP + email verification', () => {
    it('verifies email with the issued OTP', async () => {
      const { body } = await register();
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: validUser.email, code: body.data.devOtp, purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(200);
      expect(res.body.data.verified).toBe(true);
    });

    it('rejects a wrong OTP', async () => {
      await register();
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: validUser.email, code: '000000', purpose: 'EMAIL_VERIFICATION' });
      expect(res.status).toBe(400);
    });
  });

  describe('Password reset via OTP', () => {
    it('resets the password with a PASSWORD_RESET OTP', async () => {
      await register();
      const otpRes = await request(app)
        .post('/api/auth/otp/request')
        .send({ email: validUser.email, purpose: 'PASSWORD_RESET' });
      const code = otpRes.body.data.devOtp as string;

      const reset = await request(app)
        .post('/api/auth/password/reset')
        .send({ email: validUser.email, code, newPassword: 'BrandNewPass1' });
      expect(reset.status).toBe(200);

      // Old password fails, new password works.
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'BrandNewPass1' });
      expect(newLogin.status).toBe(200);
    });
  });

  describe('Change password (authenticated)', () => {
    it('changes the password for a logged-in user', async () => {
      const { body } = await register();
      const res = await request(app)
        .post('/api/auth/password/change')
        .set('Authorization', `Bearer ${body.data.tokens.accessToken}`)
        .send({ currentPassword: validUser.password, newPassword: 'Another1Pass' });
      expect(res.status).toBe(200);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'Another1Pass' });
      expect(newLogin.status).toBe(200);
    });
  });
});
