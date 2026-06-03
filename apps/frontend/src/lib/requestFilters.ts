import { InspectionRequestStatus } from '@fire-system/shared-types';

export type InspectionRequestListFilter =
  | 'all'
  | 'pending'
  | 'reviewing'
  | 'denied'
  | 'approved';

export function requestStatusForFilter(
  filter: InspectionRequestListFilter,
): InspectionRequestStatus | undefined {
  switch (filter) {
    case 'pending':
      return InspectionRequestStatus.PENDING;
    case 'reviewing':
      return InspectionRequestStatus.REVIEWING;
    case 'denied':
      return InspectionRequestStatus.DENIED;
    case 'approved':
      return InspectionRequestStatus.APPROVED;
    default:
      return undefined;
  }
}
