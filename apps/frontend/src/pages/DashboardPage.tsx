import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { InspectionStatus } from '@fire-system/shared-types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ReportBarChart } from '@/components/ReportBarChart';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import * as reportsApi from '@/api/reports';
import { EXTINGUISHER_STATUS_LABELS, INSPECTION_STATUS_LABELS } from '@/lib/labels';
import { getErrorMessage } from '@/lib/errors';

const CHART_COLORS = ['#D72638', '#F4A261', '#2A9D8F', '#94A3B8', '#22C55E'];
const INSPECTION_CHART_COLORS: Record<string, string> = {
  SCHEDULED: '#F4A261',
  COMPLETED: '#2A9D8F',
  CANCELLED: '#94A3B8',
};

function inspectionCount(
  rows: { key: string; count: number }[],
  status: InspectionStatus,
): number {
  return rows.find((s) => s.key === status)?.count ?? 0;
}

export function DashboardPage() {
  const [summary, setSummary] = useState<reportsApi.ReportSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getSummary()
      .then(setSummary)
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error || !summary) {
    return (
      <p className="text-danger">{error || 'Unable to load dashboard'}</p>
    );
  }

  const expiredUnits =
    summary.byStatus.find((s) => s.key === 'EXPIRED')?.count ?? summary.expiredCount;

  const ongoingInspections = inspectionCount(
    summary.inspectionsByStatus,
    InspectionStatus.SCHEDULED,
  );
  const completedInspections = inspectionCount(
    summary.inspectionsByStatus,
    InspectionStatus.COMPLETED,
  );
  const cancelledInspections = inspectionCount(
    summary.inspectionsByStatus,
    InspectionStatus.CANCELLED,
  );

  const statusData = summary.byStatus.map((s) => ({
    name: EXTINGUISHER_STATUS_LABELS[s.key] ?? s.key,
    count: s.count,
  }));
  const typeData = summary.byType.map((t) => ({ name: t.key, count: t.count }));
  const inspectionData = summary.inspectionsByStatus.map((s) => ({
    name: INSPECTION_STATUS_LABELS[s.key] ?? s.key,
    count: s.count,
  }));
  const inspectionColors = summary.inspectionsByStatus.map(
    (s) => INSPECTION_CHART_COLORS[s.key] ?? '#94A3B8',
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Operations Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Real-time fleet overview for TWZ Ltd facilities · Updated{' '}
          {new Date(summary.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Extinguishers"
          value={summary.totalExtinguishers}
          icon={Flame}
          accent="accent"
        />
        <StatCard
          label="Expired Units"
          value={expiredUnits}
          icon={AlertTriangle}
          accent="primary"
          sub="Units labeled EXPIRED — requires immediate action"
        />
        <StatCard
          label="Fleet Health"
          value={
            summary.totalExtinguishers
              ? `${Math.round(
                  ((summary.totalExtinguishers - expiredUnits) /
                    summary.totalExtinguishers) *
                    100,
                )}%`
              : '—'
          }
          icon={TrendingUp}
          accent="success"
        />
        <StatCard
          label="Ongoing Inspections"
          value={ongoingInspections}
          icon={Clock}
          accent="secondary"
          sub="Scheduled and awaiting field work"
        />
        <StatCard
          label="Completed Inspections"
          value={completedInspections}
          icon={CheckCircle2}
          accent="accent"
          sub="Finished with pass/fail recorded"
        />
        <StatCard
          label="Cancelled Inspections"
          value={cancelledInspections}
          icon={ClipboardCheck}
          accent="warning"
          sub="Cancelled assignments"
        />
      </div>

      <div className="card-surface p-6">
        <h2 className="text-lg font-semibold">Inspection activity</h2>
        <p className="mt-1 text-sm text-muted">Ongoing vs completed work across the fleet</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-input border border-secondary/40 bg-secondary/10 px-3 py-2">
            <StatusBadge status={InspectionStatus.SCHEDULED} kind="inspection" />
            <span className="text-sm font-semibold text-text">{ongoingInspections}</span>
          </div>
          <div className="flex items-center gap-2 rounded-input border border-accent/40 bg-accent/10 px-3 py-2">
            <StatusBadge status={InspectionStatus.COMPLETED} kind="inspection" />
            <span className="text-sm font-semibold text-text">{completedInspections}</span>
          </div>
          {cancelledInspections > 0 && (
            <div className="flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-2">
              <StatusBadge status={InspectionStatus.CANCELLED} kind="inspection" />
              <span className="text-sm font-semibold text-text">{cancelledInspections}</span>
            </div>
          )}
        </div>
        {inspectionData.length > 0 ? (
          <div className="mt-6 h-56 rounded-input bg-background/50 p-2">
            <ReportBarChart
              data={inspectionData}
              colors={inspectionColors}
              singleColor="#2A9D8F"
            />
          </div>
        ) : (
          <p className="mt-6 py-8 text-center text-sm text-muted">No inspections recorded yet.</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">Status Distribution</h2>
          <div className="mt-4 h-64 rounded-input bg-background/50 p-2">
            <ReportBarChart data={statusData} colors={CHART_COLORS} singleColor="#2A9D8F" />
          </div>
        </div>

        <div className="card-surface p-6">
          <h2 className="text-lg font-semibold">Type Breakdown</h2>
          <div className="mt-4 h-64 rounded-input bg-background/50 p-2">
            <ReportBarChart data={typeData} singleColor="#2A9D8F" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link to="/app/extinguishers" className="btn-primary">
          Manage Extinguishers
        </Link>
        <Link to="/app/inspections" className="btn-secondary">
          Assign Inspections
        </Link>
        <Link to="/app/reports" className="btn-secondary">
          Download Reports
        </Link>
      </div>
    </div>
  );
}
