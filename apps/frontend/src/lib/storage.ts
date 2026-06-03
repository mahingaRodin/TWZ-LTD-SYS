import type { AuthTokens, PublicUser } from '@fire-system/shared-types';

const ACCESS = 'twz_access_token';
const REFRESH = 'twz_refresh_token';
const USER = 'twz_user';

export function loadStoredAuth(): { tokens: AuthTokens | null; user: PublicUser | null } {
  const accessToken = localStorage.getItem(ACCESS);
  const refreshToken = localStorage.getItem(REFRESH);
  const raw = localStorage.getItem(USER);
  let user: PublicUser | null = null;
  if (raw) {
    try {
      user = JSON.parse(raw) as PublicUser;
    } catch {
      user = null;
    }
  }
  const tokens =
    accessToken && refreshToken ? { accessToken, refreshToken } : null;
  return { tokens, user };
}

export function saveAuth(tokens: AuthTokens, user: PublicUser): void {
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
  localStorage.setItem(USER, JSON.stringify(user));
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  localStorage.removeItem(USER);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH);
}
