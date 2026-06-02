/**
 * Shared TypeScript types and interfaces used across all services.
 */

// ----------------------------------------------------------------------------
// Domain
// ----------------------------------------------------------------------------

export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  CUSTOMER = 'CUSTOMER',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** A user as stored in the database, including the secret password hash. */
export interface UserRecord extends User {
  passwordHash: string;
}

/** A user shape that is safe to return in API responses. */
export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

// ----------------------------------------------------------------------------
// Auth / tokens
// ----------------------------------------------------------------------------

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

// ----------------------------------------------------------------------------
// API request DTOs
// ----------------------------------------------------------------------------

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface RequestOtpDto {
  email: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
  purpose: OtpPurpose;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// ----------------------------------------------------------------------------
// API response envelope
// ----------------------------------------------------------------------------

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
