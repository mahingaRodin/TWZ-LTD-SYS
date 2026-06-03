import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Total records across all pages (enables "Showing X–Y of Z"). */
  total?: number;
  pageSize?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginationProps) {
  const recordTotal = total ?? 0;
  if (totalPages < 1 || recordTotal === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, recordTotal);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
      <p className="text-sm text-muted">
        {total !== undefined ? (
          <>
            Showing <span className="font-medium text-text">{from}</span>–
            <span className="font-medium text-text">{to}</span> of{' '}
            <span className="font-medium text-text">{recordTotal}</span>
            {totalPages > 1 && (
              <span className="ml-2">
                · Page {page} of {totalPages}
              </span>
            )}
          </>
        ) : (
          <>Page {page} of {totalPages}</>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-2 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="btn-secondary px-3 py-2 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
