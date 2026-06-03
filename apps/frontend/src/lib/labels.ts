import { InspectionRequestStatus, UserRole } from '@fire-system/shared-types';

export const REQUEST_STATUS_LABELS: Record<InspectionRequestStatus, string> = {
  [InspectionRequestStatus.PENDING]: 'Awaiting review',
  [InspectionRequestStatus.REVIEWING]: 'Under review',
  [InspectionRequestStatus.DENIED]: 'Denied',
  [InspectionRequestStatus.APPROVED]: 'Approved',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.INSPECTOR]: 'Inspector',
  [UserRole.USER]: 'Facility manager',
};

export const EXTINGUISHER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
  MAINTENANCE: 'Under inspection',
  DECOMMISSIONED: 'Decommissioned',
};

export const INSPECTION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RESULT_LABELS: Record<string, string> = {
  PASS: 'Passed',
  FAIL: 'Failed',
};
