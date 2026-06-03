import { CheckCircle2, Clock, ThumbsDown, ThumbsUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';

export interface InspectionStats {
  ongoing: number;
  done: number;
  passed: number;
  failed: number;
  cancelled?: number;
}

export function InspectionDashboardStats({ stats }: { stats: InspectionStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Ongoing"
        value={stats.ongoing}
        icon={Clock}
        accent="secondary"
        sub="Scheduled — awaiting field work"
      />
      <StatCard
        label="Done"
        value={stats.done}
        icon={CheckCircle2}
        accent="accent"
        sub="Completed inspections"
      />
      <StatCard
        label="Passed"
        value={stats.passed}
        icon={ThumbsUp}
        accent="success"
        sub="Completed with pass result"
      />
      <StatCard
        label="Failed"
        value={stats.failed}
        icon={ThumbsDown}
        accent="primary"
        sub="Completed with fail result"
      />
    </div>
  );
}

export type InspectionListFilter = 'all' | 'ongoing' | 'done' | 'passed' | 'failed';

export function InspectionFilterTabs({
  value,
  onChange,
  stats,
  hideAll,
}: {
  value: InspectionListFilter;
  onChange: (v: InspectionListFilter) => void;
  stats: InspectionStats;
  /** Inspector view: only passed / failed tabs */
  hideAll?: boolean;
}) {
  const tabs: { id: InspectionListFilter; label: string; count: number }[] = hideAll
    ? [
        { id: 'passed', label: 'Passed', count: stats.passed },
        { id: 'failed', label: 'Failed', count: stats.failed },
      ]
    : [
        { id: 'all', label: 'All', count: stats.ongoing + stats.done + (stats.cancelled ?? 0) },
        { id: 'ongoing', label: 'Ongoing', count: stats.ongoing },
        { id: 'done', label: 'Done', count: stats.done },
        { id: 'passed', label: 'Passed', count: stats.passed },
        { id: 'failed', label: 'Failed', count: stats.failed },
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
