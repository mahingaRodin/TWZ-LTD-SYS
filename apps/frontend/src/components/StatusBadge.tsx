import {
  EXTINGUISHER_STATUS_LABELS,
  INSPECTION_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  RESULT_LABELS,
} from '@/lib/labels';
import { InspectionRequestStatus } from '@fire-system/shared-types';

type StatusKind = 'request' | 'extinguisher' | 'inspection' | 'result';

const requestStyles: Record<string, string> = {
  PENDING: 'bg-warning/15 text-warning border-warning/50',
  REVIEWING: 'bg-secondary/15 text-secondary border-secondary/50',
  DENIED: 'bg-danger/15 text-danger border-danger/50',
  APPROVED: 'bg-success/15 text-success border-success/50',
};

const extinguisherStyles: Record<string, string> = {
  ACTIVE: 'bg-accent/15 text-accent border-accent/50',
  EXPIRED: 'bg-primary/15 text-primary border-primary/50',
  MAINTENANCE: 'bg-secondary/15 text-secondary border-secondary/50',
  DECOMMISSIONED: 'bg-muted/20 text-muted border-border',
};

const inspectionStyles: Record<string, string> = {
  SCHEDULED: 'bg-secondary/15 text-secondary border-secondary/50',
  COMPLETED: 'bg-success/15 text-success border-success/50',
  CANCELLED: 'bg-muted/20 text-muted border-border',
};

const resultStyles: Record<string, string> = {
  PASS: 'bg-success/15 text-success border-success/50',
  FAIL: 'bg-danger/15 text-danger border-danger/50',
};

function labelFor(status: string, kind: StatusKind): string {
  if (kind === 'request' && status in REQUEST_STATUS_LABELS) {
    return REQUEST_STATUS_LABELS[status as InspectionRequestStatus];
  }
  if (kind === 'extinguisher') return EXTINGUISHER_STATUS_LABELS[status] ?? status;
  if (kind === 'inspection') return INSPECTION_STATUS_LABELS[status] ?? status;
  return RESULT_LABELS[status] ?? status;
}

function stylesFor(status: string, kind: StatusKind): string {
  const map =
    kind === 'request'
      ? requestStyles
      : kind === 'extinguisher'
        ? extinguisherStyles
        : kind === 'inspection'
          ? inspectionStyles
          : resultStyles;
  return map[status] ?? 'bg-surface text-muted border-border';
}

export function StatusBadge({
  status,
  kind = 'extinguisher',
}: {
  status: string;
  kind?: StatusKind;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${stylesFor(status, kind)}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          kind === 'request' && status === 'PENDING'
            ? 'bg-warning'
            : kind === 'request' && status === 'APPROVED'
              ? 'bg-success'
              : kind === 'request' && status === 'DENIED'
                ? 'bg-danger'
                : 'bg-current'
        }`}
      />
      {labelFor(status, kind)}
    </span>
  );
}
