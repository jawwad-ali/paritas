'use client';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ReportRange } from '../use-report-range';

/** Start and end day (inclusive), with the time zone the days are counted in. */
export const RangeFields = ({ range, idPrefix }: { range: ReportRange; idPrefix: string }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-3">
      <Field data-invalid={Boolean(range.problem)}>
        <FieldLabel htmlFor={`${idPrefix}-from`}>From</FieldLabel>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          value={range.params.from}
          max={range.params.to}
          onChange={(event) => range.setFrom(event.target.value)}
        />
      </Field>
      <Field data-invalid={Boolean(range.problem)}>
        <FieldLabel htmlFor={`${idPrefix}-to`}>To</FieldLabel>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={range.params.to}
          min={range.params.from}
          onChange={(event) => range.setTo(event.target.value)}
        />
      </Field>
    </div>
    {range.problem ? (
      <FieldError>{range.problem}</FieldError>
    ) : (
      <FieldDescription>Both days included, counted in {range.params.timeZone}.</FieldDescription>
    )}
  </div>
);
