import { InspectionResult, InspectionStatus } from '@fire-system/shared-types';
import type { InspectionFilters } from '@/api/inspections';
import type { InspectionListFilter } from '@/components/InspectionDashboardStats';

export function inspectionFiltersForTab(tab: InspectionListFilter): Pick<
  InspectionFilters,
  'status' | 'result'
> {
  switch (tab) {
    case 'ongoing':
      return { status: InspectionStatus.SCHEDULED };
    case 'done':
      return { status: InspectionStatus.COMPLETED };
    case 'passed':
      return { status: InspectionStatus.COMPLETED, result: InspectionResult.PASS };
    case 'failed':
      return { status: InspectionStatus.COMPLETED, result: InspectionResult.FAIL };
    default:
      return {};
  }
}
