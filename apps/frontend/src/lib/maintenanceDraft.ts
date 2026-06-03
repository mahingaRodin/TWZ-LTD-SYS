import { InspectionResult } from '@fire-system/shared-types';

/** Passed via router state after an inspector completes a field inspection. */
export interface MaintenanceLogDraft {
  extinguisherId: string;
  inspectionId: string;
  inspectionResult: InspectionResult;
  /** ISO date (YYYY-MM-DD), set to today at completion time. */
  actionDate: string;
  conditionNoted?: string;
  suggestedAction?: string;
}

export function buildMaintenanceDraft(params: {
  extinguisherId: string;
  inspectionId: string;
  result: InspectionResult;
  inspectionNotes?: string;
}): MaintenanceLogDraft {
  const actionDate = new Date().toISOString().slice(0, 10);
  const suggestedAction =
    params.result === InspectionResult.PASS
      ? 'Field inspection completed — unit passed'
      : 'Field inspection completed — unit failed; corrective action taken';

  return {
    extinguisherId: params.extinguisherId,
    inspectionId: params.inspectionId,
    inspectionResult: params.result,
    actionDate,
    conditionNoted: params.inspectionNotes?.trim() || '',
    suggestedAction,
  };
}

export function todayActionDate(): string {
  return new Date().toISOString().slice(0, 10);
}
