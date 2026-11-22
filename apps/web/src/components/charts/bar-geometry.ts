import type { BarLayout, ChartDatum, ChartSeries } from './chart.types';

export const CHART_PADDING = { top: 8, right: 8, bottom: 24, left: 36 } as const;
/** Surface gap between adjacent fills (stacked segments and neighbouring bars). */
export const FILL_GAP = 2;
const DATA_END_RADIUS = 4;
const MAX_BAR_WIDTH = 28;

export interface BarRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  /** Only the end of the column away from the baseline is rounded. */
  roundTop: boolean;
}

/** A "nice" axis maximum (1, 2, 2.5 or 5 × 10ⁿ) at or above the data maximum. */
export const niceMax = (value: number): number => {
  if (value <= 0) {
    return 4;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= value) ?? 10;
  return step * magnitude;
};

/** Path for a rectangle whose top corners are rounded (the data end of a column). */
export const columnPath = ({ x, y, width, height, roundTop }: BarRect): string => {
  const r = roundTop ? Math.min(DATA_END_RADIUS, width / 2, height) : 0;
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
};

/** Lays out every bar of every category for the plot's inner width and height. */
export const layoutBars = (
  data: ChartDatum[],
  series: ChartSeries[],
  layout: BarLayout,
  innerWidth: number,
  innerHeight: number,
  max: number,
): { band: number; bars: BarRect[][] } => {
  const band = innerWidth / Math.max(data.length, 1);
  const groupWidth = Math.min(band * 0.7, layout === 'grouped' ? MAX_BAR_WIDTH * 2 : MAX_BAR_WIDTH);
  const scale = (value: number): number => (value / max) * innerHeight;

  const bars = data.map((datum, index) => {
    const left = CHART_PADDING.left + index * band + (band - groupWidth) / 2;
    if (layout === 'grouped') {
      const width = (groupWidth - FILL_GAP * (series.length - 1)) / series.length;
      return series.map((s, i) => {
        const height = scale(datum.values[s.key] ?? 0);
        return {
          key: s.key,
          x: left + i * (width + FILL_GAP),
          y: CHART_PADDING.top + innerHeight - height,
          width,
          height,
          color: s.color,
          roundTop: true,
        };
      });
    }
    let base = CHART_PADDING.top + innerHeight;
    const visible = series.filter((s) => (datum.values[s.key] ?? 0) > 0);
    return visible.map((s, i) => {
      const gap = i > 0 ? FILL_GAP : 0;
      const height = Math.max(scale(datum.values[s.key] ?? 0) - gap, 0);
      base -= height + gap;
      return {
        key: s.key,
        x: left,
        y: base,
        width: groupWidth,
        height,
        color: s.color,
        roundTop: i === visible.length - 1,
      };
    });
  });
  return { band, bars };
};
