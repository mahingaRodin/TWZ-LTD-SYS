import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

interface LogoProps {
  to?: string;
  className?: string;
}

export function Logo({ to = '/', className = '' }: LogoProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <Flame className="h-6 w-6 text-primary" aria-hidden />
      <span>
        TWZ <span className="text-primary">LTD</span>
      </span>
    </span>
  );
  if (to) {
    return (
      <Link to={to} className="text-text hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}
