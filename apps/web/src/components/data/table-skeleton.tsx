import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Loading rows in the table's own shape, so nothing jumps when data lands. */
export const TableSkeleton = ({ rows = 8, columns = 6 }: TableSkeletonProps) => (
  <div className="divide-y rounded-md border bg-card" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, row) => (
      <div key={row} className="flex items-center gap-4 px-4 py-3">
        {Array.from({ length: columns }, (_, column) => (
          <Skeleton key={column} className={column === 0 ? 'h-4 flex-[2]' : 'h-4 flex-1'} />
        ))}
      </div>
    ))}
  </div>
);
