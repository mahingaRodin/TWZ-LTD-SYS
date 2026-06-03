import request from 'supertest';
import { DEFAULT_PROVISIONED_PASSWORD } from '@fire-system/shared-constants';
import { OtpPurpose, UserRole } from '@fire-system/shared-types';
import authApp from '../../../../apps/backend/auth-service/src/app';
import { getPool } from './db';
import { issueTestOtp } from './otp';

export const validUser = {
  firstName: 'Alice',
  lastName: 'Tester',
  email: 'alice@example.com',
  password: 'Sup3rSecret!',
};

export function register(overrides: Partial<typeof validUser> = {}) {
  return request(authApp)
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

export async function registerAndLogin(overrides: Partial<typeof validUser> = {}) {
  const merged = { ...validUser, ...overrides };
  await register(overrides);
  const code = await issueTestOtp(merged.email, OtpPurpose.EMAIL_VERIFICATION);
  await request(authApp)
    .post('/api/auth/otp/verify')
    .send({ email: merged.email, code, purpose: OtpPurpose.EMAIL_VERIFICATION });
  const login = await request(authApp)
    .post('/api/auth/login')
    .send({ email: merged.email, password: merged.password });
  return login.body.data as {
    user: Record<string, unknown>;
    tokens: { accessToken: string; refreshToken: string };
  };
}

export async function adminToken(): Promise<string> {
  await request(authApp)
    .post('/api/auth/register')
    .send({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'AdminPass1!',
    });
  const code = await issueTestOtp('admin@test.com');
  await request(authApp)
    .post('/api/auth/otp/verify')
    .send({ email: 'admin@test.com', code, purpose: OtpPurpose.EMAIL_VERIFICATION });
  await getPool().query(`UPDATE users SET role = 'ADMIN' WHERE lower(email) = lower('admin@test.com')`);
  const login = await request(authApp)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'AdminPass1!' });
  return login.body.data.tokens.accessToken as string;
}

export async function inspectorToken(): Promise<string> {
  const admin = await adminToken();
  await request(authApp)
    .post('/api/auth/users')
    .set('Authorization', `Bearer ${admin}`)
    .send({
      firstName: 'Ian',
      lastName: 'Inspector',
      email: 'inspector@test.com',
      role: UserRole.INSPECTOR,
    });
  const login = await request(authApp)
    .post('/api/auth/login')
    .send({ email: 'inspector@test.com', password: DEFAULT_PROVISIONED_PASSWORD });
  return login.body.data.tokens.accessToken as string;
}

export async function facilityToken(): Promise<string> {
  const admin = await adminToken();
  await request(authApp)
    .post('/api/auth/users')
    .set('Authorization', `Bearer ${admin}`)
    .send({
      firstName: 'Facility',
      lastName: 'User',
      email: 'facility@test.com',
      role: UserRole.USER,
    });
  const login = await request(authApp)
    .post('/api/auth/login')
    .send({ email: 'facility@test.com', password: DEFAULT_PROVISIONED_PASSWORD });
  return login.body.data.tokens.accessToken as string;
}
