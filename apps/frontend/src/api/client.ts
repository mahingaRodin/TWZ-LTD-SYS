import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthTokens } from '@fire-system/shared-types';
import { AUTH_API } from '@/config';
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '@/lib/storage';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<ApiResponse<AuthTokens>>(
      `${AUTH_API}/api/auth/refresh`,
      { refreshToken },
    );
    if (data.success) {
      saveTokens(data.data);
      return data.data.accessToken;
    }
  } catch {
    clearAuth();
  }
  return null;
}

function attachAuthInterceptor(client: AxiosInstance): void {
  client.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as RetriableConfig | undefined;
      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !original.url?.includes('/api/auth/login') &&
        !original.url?.includes('/api/auth/refresh')
      ) {
        original._retry = true;
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const token = await refreshPromise;
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        }
        clearAuth();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );
}

export function createApi(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });
  attachAuthInterceptor(client);
  return client;
}

export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  const body = res.data;
  if (!body.success) {
    throw new Error(body.error.message);
  }
  return body.data;
}
