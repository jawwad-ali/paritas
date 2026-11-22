'use client';

import {
  EXCEPTION_SORTS,
  EXCEPTION_TYPES,
  type ExceptionStatsDto,
  SOURCE_CODES,
} from '@paritas/shared';
import { X } from 'lucide-react';
import { FilterMenu } from '@/components/data/filter-menu';
import { SearchBox } from '@/components/data/search-box';
import { SelectFilter } from '@/components/data/select-filter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  QUEUE_VIEW_LABELS,
  QUEUE_VIEWS,
  type QueueFilters,
  SEVERITY_LABELS,
  SEVERITY_OPTIONS,
  SORT_LABELS,
  SOURCE_LABELS,
  TYPE_LABELS,
  viewCount,
} from '../exception-filters';

interface QueueToolbarProps {
  filters: QueueFilters;
  stats: ExceptionStatsDto | undefined;
  onChange: (patch: Partial<QueueFilters>) => void;
}

const SOURCE_OPTIONS = Object.values(SOURCE_CODES);
const NUMBER = new Intl.NumberFormat('en-US');

export const QueueToolbar = ({ filters, stats, onChange }: QueueToolbarProps) => {
  const narrowed = Boolean(filters.type || filters.severity || filters.source || filters.search);

  return (
    <div className="space-y-3">
      <nav aria-label="Queue views" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {QUEUE_VIEWS.map((view) => {
          const active = filters.view === view;
          const count = stats ? viewCount(view, stats) : undefined;
          return (
            <button
              key={view}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange({ view })}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {QUEUE_VIEW_LABELS[view]}
              {count !== undefined && (
                <span
                  className={cn('tabular-nums', active ? 'opacity-90' : 'text-muted-foreground')}
                >
                  {NUMBER.format(count)}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchBox
          label="Search exceptions"
          placeholder="EX-1042, a reference or a customer"
          value={filters.search}
          onChange={(search) => onChange({ search })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu
            label="Severity"
            options={SEVERITY_OPTIONS}
            labels={SEVERITY_LABELS}
            selected={filters.severity}
            onChange={(severity) => onChange({ severity })}
          />
          <FilterMenu
            label="Type"
            options={EXCEPTION_TYPES}
            labels={TYPE_LABELS}
            selected={filters.type}
            onChange={(type) => onChange({ type })}
          />
          <SelectFilter
            label="Source"
            allLabel="All sources"
            options={SOURCE_OPTIONS}
            labels={SOURCE_LABELS}
            value={filters.source}
            onChange={(source) => onChange({ source })}
          />
          {narrowed && (
            <Button
              variant="ghost"
              onClick={() =>
                onChange({
                  type: undefined,
                  severity: undefined,
                  source: undefined,
                  search: undefined,
                })
              }
            >
              <X data-icon="inline-start" />
              Clear filters
            </Button>
          )}
        </div>
        <div className="lg:ml-auto">
          <SelectFilter
            label="Sort"
            allLabel={SORT_LABELS.priority}
            options={EXCEPTION_SORTS.filter((sort) => sort !== 'priority')}
            labels={SORT_LABELS}
            value={filters.sort === 'priority' ? undefined : filters.sort}
            onChange={(sort) => onChange({ sort: sort ?? 'priority' })}
          />
        </div>
      </div>
    </div>
  );
};
