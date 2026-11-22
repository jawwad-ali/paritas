export interface ChartSeries {
  key: string;
  label: string;
  /** A CSS colour, normally a series token such as var(--series-settled). */
  color: string;
}

export interface ChartDatum {
  /** Category on the x axis (a day, YYYY-MM-DD). */
  label: string;
  values: Record<string, number>;
}

export type BarLayout = 'stacked' | 'grouped';
