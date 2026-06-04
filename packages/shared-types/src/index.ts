/**
 * Shared TypeScript types and interfaces used across all services.
 * This package is the single source of truth for domain shapes and the
 * request/response contracts exchanged over the REST APIs.
 */

// ----------------------------------------------------------------------------
// Users & auth
// ----------------------------------------------------------------------------

export enum UserRole {
  /** Manages system features, user accounts, and data integrity. */
  ADMIN = 'ADMIN',
  /** Conducts inspections, logs results, schedules maintenance. */
  INSPECTOR = 'INSPECTOR',
  /** Views extinguisher status and schedules inspections. */
  USER = 'USER',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
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
// Fire extinguishers
// ----------------------------------------------------------------------------

export enum ExtinguisherType {
  WATER = 'WATER',
  CO2 = 'CO2',
  FOAM = 'FOAM',
  DRY_CHEMICAL = 'DRY_CHEMICAL',
}

/** Cylinder sizes. Kept as string literals because they start with digits. */
export const EXTINGUISHER_SIZES = ['2.5lbs', '5lbs', '9lbs', '12lbs'] as const;
export type ExtinguisherSize = (typeof EXTINGUISHER_SIZES)[number];

export enum ExtinguisherStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface Extinguisher {
  id: string;
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string; // ISO date (YYYY-MM-DD)
  expiryDate: string; // ISO date (YYYY-MM-DD)
  status: ExtinguisherStatus;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------------------------
// Inspections
// ----------------------------------------------------------------------------

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InspectionResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
}

export interface Inspection {
  id: string;
  extinguisherId: string;
  scheduledAt: Date;
  inspectorId: string | null;
  status: InspectionStatus;
  result: InspectionResult | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------------------------
// Maintenance
// ----------------------------------------------------------------------------

export interface MaintenanceLog {
  id: string;
  extinguisherId: string;
  actionTaken: string;
  actionDate: string; // ISO date (YYYY-MM-DD)
  conditionNoted: string | null;
  performedBy: string | null;
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// Inspection requests (facility manager → admin workflow)
// ----------------------------------------------------------------------------

export enum InspectionRequestStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  DENIED = 'DENIED',
  APPROVED = 'APPROVED',
}

export interface InspectionRequest {
  id: string;
  extinguisherId: string;
  requestedBy: string;
  preferredAt: Date;
  notes: string | null;
  status: InspectionRequestStatus;
  adminNotes: string | null;
  inspectorId: string | null;
  inspectionId: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Joined fields for UI */
  serialNumber?: string;
  location?: string;
  requesterName?: string;
  /** Linked field inspection (only populated when inspection_id is set) */
  inspectionStatus?: InspectionStatus | null;
  inspectionResult?: InspectionResult | null;
  inspectionScheduledAt?: Date | null;
}

// ----------------------------------------------------------------------------
// Admin alerts (banner until acknowledged)
// ----------------------------------------------------------------------------

export enum AdminAlertType {
  EXPIRY_CRITICAL = 'EXPIRY_CRITICAL',
  INSPECTION_REQUEST = 'INSPECTION_REQUEST',
}

export interface AdminAlert {
  id: string;
  alertType: AdminAlertType;
  title: string;
  message: string;
  extinguisherId: string | null;
  requestId: string | null;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// Inspector alerts (banner until inspection is actioned)
// ----------------------------------------------------------------------------

export enum InspectorAlertType {
  INSPECTION_DUE_SOON = 'INSPECTION_DUE_SOON',
}

export interface InspectorAlert {
  id: string;
  alertType: InspectorAlertType;
  title: string;
  message: string;
  inspectionId: string;
  inspectorId: string;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// API response envelope & pagination
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

export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
