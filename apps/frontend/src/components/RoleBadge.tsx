import { UserRole } from '@fire-system/shared-types';
import { ROLE_LABELS } from '@/lib/labels';
import { Shield, User, Wrench } from 'lucide-react';

const roleStyles: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-primary/15 text-primary border-primary/40',
  [UserRole.INSPECTOR]: 'bg-accent/15 text-accent border-accent/40',
  [UserRole.USER]: 'bg-secondary/15 text-secondary border-secondary/40',
};

const icons = {
  [UserRole.ADMIN]: Shield,
  [UserRole.INSPECTOR]: Wrench,
  [UserRole.USER]: User,
};

export function RoleBadge({ role }: { role: UserRole }) {
  const Icon = icons[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${roleStyles[role]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {ROLE_LABELS[role]}
    </span>
  );
}
