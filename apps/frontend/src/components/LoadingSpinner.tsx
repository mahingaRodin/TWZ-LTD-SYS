export function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16" role="status">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
