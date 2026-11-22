'use client';

import {
  EXCEPTION_STATUSES,
  EXCEPTION_TYPES,
  type ExceptionSeverity,
  type ExceptionStatus,
  type ExceptionType,
  SOURCE_CODES,
  type SourceCode,
} from '@paritas/shared';
import { useState } from 'react';
import { FilterMenu } from '@/components/data/filter-menu';
import { SelectFilter } from '@/components/data/select-filter';
import { EXCEPTION_STATUS_STYLES } from '@/components/domain/status.config';
import {
  SEVERITY_LABELS,
  SEVERITY_OPTIONS,
  SOURCE_LABELS,
  TYPE_LABELS,
} from '@/features/exceptions/exception-filters';
import { downloadExceptionReport } from '@/lib/api/endpoints/insights';
import { useReportRange } from '../use-report-range';
import { DownloadButtons } from './download-buttons';
import { RangeFields } from './range-fields';

const STATUS_LABELS = Object.fromEntries(
  EXCEPTION_STATUSES.map((status) => [status, EXCEPTION_STATUS_STYLES[status].label]),
) as Record<ExceptionStatus, string>;

/** Every exception detected in the range, one row each, for audit; filter like the queue. */
export const ExceptionReportCard = () => {
  const range = useReportRange();
  const [status, setStatus] = useState<ExceptionStatus[] | undefined>();
  const [type, setType] = useState<ExceptionType[] | undefined>();
  const [severity, setSeverity] = useState<ExceptionSeverity[] | undefined>();
  const [source, setSource] = useState<SourceCode | undefined>();

  return (
    <section
      aria-labelledby="exception-report"
      className="space-y-4 rounded-md border bg-card p-4 sm:p-6"
    >
      <div className="space-y-1">
        <h2 id="exception-report" className="text-lg font-bold tracking-tight">
          Exception report
        </h2>
        <p className="text-muted-foreground">
          Each exception detected in the range: type, severity, status, amount, records, who closed
          it and why. The CSV holds any number of rows; a PDF holds up to 1,000.
        </p>
      </div>
      <RangeFields range={range} idPrefix="exceptions" />
      <div className="flex flex-wrap gap-2">
        <FilterMenu
          label="Status"
          options={EXCEPTION_STATUSES}
          labels={STATUS_LABELS}
          selected={status}
          onChange={setStatus}
        />
        <FilterMenu
          label="Severity"
          options={SEVERITY_OPTIONS}
          labels={SEVERITY_LABELS}
          selected={severity}
          onChange={setSeverity}
        />
        <FilterMenu
          label="Type"
          options={EXCEPTION_TYPES}
          labels={TYPE_LABELS}
          selected={type}
          onChange={setType}
        />
        <SelectFilter
          label="Source"
          allLabel="All sources"
          options={Object.values(SOURCE_CODES)}
          labels={SOURCE_LABELS}
          value={source}
          onChange={setSource}
        />
      </div>
      <DownloadButtons
        disabled={!range.ready || range.problem !== null}
        download={(format) =>
          downloadExceptionReport({ ...range.params, status, type, severity, source }, format)
        }
      />
    </section>
  );
};
