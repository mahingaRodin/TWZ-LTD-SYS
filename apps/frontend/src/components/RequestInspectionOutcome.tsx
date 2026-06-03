import {
  InspectionRequestStatus,
  InspectionStatus,
  type InspectionRequest,
} from '@fire-system/shared-types';
import { StatusBadge } from '@/components/StatusBadge';
import { INSPECTION_STATUS_LABELS } from '@/lib/labels';

/** Field inspection outcome for a facility user's own request (from linked inspection row). */
export function RequestInspectionOutcome({ request }: { request: InspectionRequest }) {
  if (request.status === InspectionRequestStatus.DENIED) {
    return null;
  }

  if (request.status !== InspectionRequestStatus.APPROVED) {
    return (
      <p className="mt-2 text-xs text-muted">
        Outcome will appear here after admin approves and the field inspection is completed.
      </p>
    );
  }

  if (!request.inspectionId) {
    return (
      <p className="mt-2 text-xs text-muted">Approved — scheduling in progress.</p>
    );
  }

  const scheduledLabel = request.inspectionScheduledAt
    ? new Date(request.inspectionScheduledAt).toLocaleString()
    : null;

  if (request.inspectionStatus === InspectionStatus.COMPLETED && request.inspectionResult) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inspection outcome</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={request.inspectionResult} kind="result" />
          <span className="text-xs text-muted">
            {scheduledLabel ? `Visit scheduled ${scheduledLabel}` : 'Field visit completed'}
          </span>
        </div>
      </div>
    );
  }

  if (request.inspectionStatus === InspectionStatus.CANCELLED) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inspection outcome</p>
        <p className="mt-1 text-sm text-muted">The scheduled visit was cancelled. Contact admin if you need a new date.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-background/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Inspection progress</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge
          status={request.inspectionStatus ?? InspectionStatus.SCHEDULED}
          kind="inspection"
        />
        {scheduledLabel && (
          <span className="text-xs text-muted">
            {INSPECTION_STATUS_LABELS.SCHEDULED}: {scheduledLabel}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Pass/fail will show here when the inspector completes the visit.</p>
    </div>
  );
}
