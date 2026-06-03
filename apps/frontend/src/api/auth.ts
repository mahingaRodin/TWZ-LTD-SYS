import type {
  ApiResponse,
  AuthResult,
  AuthTokens,
  OtpPurpose,
  PublicUser,
} from '@fire-system/shared-types';
import { AUTH_API } from '@/config';
import axios from 'axios';
import { createApi, unwrap } from './client';

const api = createApi(AUTH_API);
const publicApi = axios.create({
  baseURL: AUTH_API,
  headers: { 'Content-Type': 'application/json' },
});

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  user: PublicUser;
  message: string;
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const res = await publicApi.post<ApiResponse<RegisterResult>>('/api/auth/register', payload);
  return unwrap(res);
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await publicApi.post<ApiResponse<AuthResult>>('/api/auth/login', { email, password });
  return unwrap(res);
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem('twz_refresh_token');
  if (refreshToken) {
    try {
      await publicApi.post('/api/auth/logout', { refreshToken });
    } catch {
      /* ignore */
    }
  }
}

export async function requestOtp(email: string, purpose: OtpPurpose): Promise<{ message: string }> {
  const res = await publicApi.post<ApiResponse<{ message: string }>>(
    '/api/auth/otp/request',
    { email, purpose },
  );
  return unwrap(res);
}

export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<{ verified: true }> {
  const res = await publicApi.post<ApiResponse<{ verified: true }>>('/api/auth/otp/verify', {
    email,
    code,
    purpose,
  });
  return unwrap(res);
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await publicApi.post('/api/auth/password/reset', { email, code, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('/api/auth/password/change', { currentPassword, newPassword });
}

export async function getProfile(): Promise<PublicUser> {
  const res = await api.get<ApiResponse<PublicUser>>('/api/auth/me');
  return unwrap(res);
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
}): Promise<PublicUser> {
  const res = await api.patch<ApiResponse<PublicUser>>('/api/auth/me', data);
  return unwrap(res);
}

export type { AuthTokens };
