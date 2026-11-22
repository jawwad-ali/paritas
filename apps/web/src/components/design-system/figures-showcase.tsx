import { Figure, Footnotes } from '@/components/domain/figure';

/** The headline-figure pattern: label, number, footnote key, and the notes that define it. */
export const FiguresShowcase = () => (
  <div className="rounded-md border bg-card px-4">
    <dl className="grid grid-cols-2 divide-x border-b lg:grid-cols-4 [&>*]:px-4 [&>*:first-child]:pl-0">
      <Figure label="Open exceptions" value="94" footnote={1} change="+12 since Monday" />
      <Figure label="Critical" value="36" tone="critical" change="+5 since Monday" />
      <Figure label="Match rate" value="66.8%" footnote={2} change="+1.9 pts on last week" />
      <Figure
        label="Median time to close"
        value="2.4 h"
        footnote={3}
        change="−0.6 h on last week"
      />
    </dl>
    <Footnotes
      className="py-3"
      notes={[
        'Open and investigating.',
        'Matched records ÷ (all records − excluded records), by payment date.',
        'Detection to resolution, for exceptions closed in the period.',
      ]}
    />
  </div>
);
