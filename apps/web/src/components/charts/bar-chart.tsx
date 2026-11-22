'use client';

import { useState } from 'react';
import { useElementWidth } from '@/hooks/use-element-width';
import { cn } from '@/lib/utils';
import { CHART_PADDING, columnPath, layoutBars, niceMax } from './bar-geometry';
import type { BarLayout, ChartDatum, ChartSeries } from './chart.types';
import { ChartDataTable } from './chart-data-table';

interface BarChartProps {
  title: string;
  data: ChartDatum[];
  series: ChartSeries[];
  layout: BarLayout;
  /** Formats an x label for the axis (short) and the tooltip (long). */
  formatLabel: (label: string, style: 'short' | 'long') => string;
  height?: number;
}

const GRID_STEPS = 4;
const NUMBER = new Intl.NumberFormat('en-US');

/**
 * Plain-SVG bars sized to their container: thin marks, a 2px surface gap
 * between fills, rounded data ends, a recessive grid, a legend, a hover
 * tooltip per column and a data table for anyone who cannot use the plot.
 */
export const BarChart = ({
  title,
  data,
  series,
  layout,
  formatLabel,
  height = 200,
}: BarChartProps) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const innerWidth = Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 0);
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
  const totals = data.map((d) =>
    layout === 'stacked'
      ? series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0)
      : Math.max(...series.map((s) => d.values[s.key] ?? 0)),
  );
  const max = niceMax(Math.max(0, ...totals));
  const { band, bars } = layoutBars(data, series, layout, innerWidth, innerHeight, max);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerWidth / 64))));
  const hovered = hover === null ? undefined : data[hover];

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold">{title}</span>
        <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </span>
      </figcaption>
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`${title}. The data table below lists every value.`}
          >
            {Array.from({ length: GRID_STEPS + 1 }, (_, step) => {
              const value = (max / GRID_STEPS) * step;
              const y = CHART_PADDING.top + innerHeight - (value / max) * innerHeight;
              return (
                <g key={step}>
                  <line
                    x1={CHART_PADDING.left}
                    x2={width - CHART_PADDING.right}
                    y1={y}
                    y2={y}
                    className={step === 0 ? 'stroke-border' : 'stroke-border/60'}
                    strokeDasharray={step === 0 ? undefined : '2 4'}
                  />
                  <text
                    x={CHART_PADDING.left - 6}
                    y={y}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {NUMBER.format(value)}
                  </text>
                </g>
              );
            })}
            {bars.map((column, index) => (
              <g
                key={data[index]?.label}
                className={cn(
                  'transition-opacity',
                  hover !== null && hover !== index && 'opacity-40',
                )}
              >
                {column.map(
                  (bar) =>
                    bar.height > 0 && <path key={bar.key} d={columnPath(bar)} fill={bar.color} />,
                )}
              </g>
            ))}
            {data.map((datum, index) =>
              index % labelEvery === 0 ? (
                <text
                  key={datum.label}
                  x={CHART_PADDING.left + index * band + band / 2}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {formatLabel(datum.label, 'short')}
                </text>
              ) : null,
            )}
            {data.map((datum, index) => (
              <rect
                key={datum.label}
                x={CHART_PADDING.left + index * band}
                y={CHART_PADDING.top}
                width={band}
                height={innerHeight}
                fill="transparent"
                onMouseEnter={() => setHover(index)}
              />
            ))}
          </svg>
        )}
        {hovered && hover !== null && (
          <div
            role="presentation"
            className="pointer-events-none absolute top-0 z-10 min-w-36 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs shadow-md"
            style={{
              left: Math.min(
                Math.max(CHART_PADDING.left + hover * band + band / 2, 72),
                width - 72,
              ),
            }}
          >
            <p className="mb-1 font-medium">{formatLabel(hovered.label, 'long')}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-[2px]"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.label}
                </span>
                <span className="font-medium tabular-nums">
                  {NUMBER.format(hovered.values[s.key] ?? 0)}
                </span>
              </p>
            ))}
          </div>
        )}
        {width === 0 && <div style={{ height }} />}
      </div>
      <ChartDataTable
        title={title}
        data={data}
        series={series}
        formatLabel={(label) => formatLabel(label, 'long')}
      />
    </figure>
  );
};
