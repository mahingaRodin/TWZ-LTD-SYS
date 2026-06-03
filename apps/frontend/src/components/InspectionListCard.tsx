import { InspectionResult, InspectionStatus, type Inspection } from '@fire-system/shared-types';
import { CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { canCompleteInspections } from '@/lib/roles';
import { UserRole } from '@fire-system/shared-types';

export function InspectionListCard({
  insp,
  serial,
  location,
  role,
  onComplete,
  onCancel,
}: {
  insp: Inspection;
  serial: string;
  location?: string;
  role: UserRole;
  onComplete?: () => void;
  onCancel?: () => void;
}) {
  const border =
    insp.status === InspectionStatus.SCHEDULED
      ? 'border-l-secondary'
      : insp.result === InspectionResult.FAIL
        ? 'border-l-primary'
        : 'border-l-accent';

  return (
    <div className={`card-surface border-l-4 p-4 ${border}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{serial}</p>
          {location && <p className="text-sm text-muted">{location}</p>}
          <p className="text-sm text-muted">{new Date(insp.scheduledAt).toLocaleString()}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={insp.status} kind="inspection" />
          {insp.result && <StatusBadge status={insp.result} kind="result" />}
        </div>
      </div>
      {insp.notes && <p className="mt-2 text-sm text-muted">{insp.notes}</p>}
      {insp.status === InspectionStatus.SCHEDULED && canCompleteInspections(role) && onComplete && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs py-2" onClick={onComplete}>
            <CheckCircle className="h-4 w-4" /> Complete
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary text-xs py-2" onClick={onCancel}>
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
