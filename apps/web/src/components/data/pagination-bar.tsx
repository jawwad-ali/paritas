import type { PageMeta } from '@paritas/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationBarProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  /** What is being counted, e.g. "exceptions". */
  noun: string;
}

const NUMBER = new Intl.NumberFormat('en-US');

export const PaginationBar = ({ meta, onPageChange, noun }: PaginationBarProps) => {
  const { page, pageSize, totalItems, totalPages } = meta;
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row"
    >
      <p className="tabular-nums" aria-live="polite">
        {NUMBER.format(first)}–{NUMBER.format(last)} of {NUMBER.format(totalItems)} {noun}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
          Previous
        </Button>
        <span className="px-1 tabular-nums">
          Page {NUMBER.format(page)} of {NUMBER.format(Math.max(totalPages, 1))}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
};
