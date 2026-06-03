import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Variant = 'error' | 'success' | 'info';

const styles: Record<Variant, string> = {
  error: 'border-danger/50 bg-danger/10 text-danger',
  success: 'border-success/50 bg-success/10 text-success',
  info: 'border-accent/50 bg-accent/10 text-accent',
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

export function Alert({
  variant = 'info',
  children,
  title,
}: {
  variant?: Variant;
  children: React.ReactNode;
  title?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      className={`flex gap-3 rounded-card border px-4 py-3 text-sm ${styles[variant]}`}
      role="alert"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="text-text/90">{children}</div>
      </div>
    </div>
  );
}
