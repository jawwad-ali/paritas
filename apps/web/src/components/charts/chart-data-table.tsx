import type { ChartDatum, ChartSeries } from './chart.types';

interface ChartDataTableProps {
  title: string;
  data: ChartDatum[];
  series: ChartSeries[];
  formatLabel: (label: string) => string;
}

const NUMBER = new Intl.NumberFormat('en-US');

/** Every value of the chart as a table: for screen readers, print, and checking a number. */
export const ChartDataTable = ({ title, data, series, formatLabel }: ChartDataTableProps) => (
  <details className="group text-xs">
    <summary className="cursor-pointer text-muted-foreground select-none hover:text-foreground">
      Show the numbers
    </summary>
    <div className="mt-2 max-h-56 overflow-auto rounded-md border">
      <table className="w-full tabular-nums">
        <caption className="sr-only">{title}</caption>
        <thead className="sticky top-0 bg-muted">
          <tr>
            <th scope="col" className="px-2 py-1 text-left font-medium">
              Day
            </th>
            {series.map((s) => (
              <th key={s.key} scope="col" className="px-2 py-1 text-right font-medium">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label} className="border-t">
              <th scope="row" className="px-2 py-1 text-left font-normal">
                {formatLabel(datum.label)}
              </th>
              {series.map((s) => (
                <td key={s.key} className="px-2 py-1 text-right">
                  {NUMBER.format(datum.values[s.key] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </details>
);
