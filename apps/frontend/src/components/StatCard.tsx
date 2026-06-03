import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  sub?: string;
}

const accentBorder = {
  primary: 'border-l-primary',
  secondary: 'border-l-secondary',
  accent: 'border-l-accent',
  success: 'border-l-success',
  warning: 'border-l-warning',
};

const accentIcon = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  sub,
}: StatCardProps) {
  return (
    <div
      className={`card-surface border-l-4 p-5 ${accentBorder[accent]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        <Icon className={`h-8 w-8 shrink-0 opacity-80 ${accentIcon[accent]}`} />
      </div>
    </div>
  );
}
