import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

export function MustChangePasswordBanner() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user?.mustChangePassword) return null;

  return (
    <div className="border-b border-warning/50 bg-warning/15 px-4 py-3 text-sm text-warning">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span>
          You must change your temporary password before continuing.{' '}
          <Link to="/app/profile" className="font-semibold underline">
            Update password now
          </Link>
        </span>
      </div>
    </div>
  );
}
