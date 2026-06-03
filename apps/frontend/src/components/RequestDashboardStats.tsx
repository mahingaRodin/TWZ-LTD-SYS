import { CheckCircle2, Clock, FileQuestion, XCircle } from 'lucide-react';
import { InspectionRequestStatus } from '@fire-system/shared-types';
import { StatCard } from '@/components/StatCard';
import { REQUEST_STATUS_LABELS } from '@/lib/labels';
import type { InspectionRequestListFilter } from '@/lib/requestFilters';

export interface InspectionRequestStats {
  pending: number;
  reviewing: number;
  denied: number;
  approved: number;
  total: number;
}

export function RequestDashboardStats({ stats }: { stats: InspectionRequestStats }) {
  const awaiting = stats.pending + stats.reviewing;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Awaiting action"
        value={awaiting}
        icon={Clock}
        accent="secondary"
        sub={`${stats.pending} pending · ${stats.reviewing} under review`}
      />
      <StatCard
        label={REQUEST_STATUS_LABELS[InspectionRequestStatus.APPROVED]}
        value={stats.approved}
        icon={CheckCircle2}
        accent="success"
        sub="Approved and scheduled"
      />
      <StatCard
        label={REQUEST_STATUS_LABELS[InspectionRequestStatus.DENIED]}
        value={stats.denied}
        icon={XCircle}
        accent="primary"
        sub="Declined by admin"
      />
      <StatCard
        label="All requests"
        value={stats.total}
        icon={FileQuestion}
        accent="accent"
        sub="Total submitted"
      />
    </div>
  );
}

export function RequestFilterTabs({
  value,
  onChange,
  stats,
}: {
  value: InspectionRequestListFilter;
  onChange: (v: InspectionRequestListFilter) => void;
  stats: InspectionRequestStats;
}) {
  const tabs: { id: InspectionRequestListFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: stats.total },
    { id: 'pending', label: REQUEST_STATUS_LABELS.PENDING, count: stats.pending },
    { id: 'reviewing', label: REQUEST_STATUS_LABELS.REVIEWING, count: stats.reviewing },
    { id: 'approved', label: REQUEST_STATUS_LABELS.APPROVED, count: stats.approved },
    { id: 'denied', label: REQUEST_STATUS_LABELS.DENIED, count: stats.denied },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`rounded-card px-4 py-2 text-sm font-medium transition ${
            value === t.id
              ? 'bg-primary text-white'
              : 'bg-surface text-muted hover:text-text'
          }`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
          <span className="ml-2 opacity-80">({t.count})</span>
        </button>
      ))}
    </div>
  );
}
