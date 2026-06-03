export function AccountBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-md border border-success/50 bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
      Active account
    </span>
  ) : (
    <span className="inline-flex items-center rounded-md border border-border bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted">
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-muted" />
      Deactivated
    </span>
  );
}
