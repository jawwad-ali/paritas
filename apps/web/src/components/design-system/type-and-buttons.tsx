import { ArrowRight, Download, Link2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const TYPE_SCALE = [
  { name: 'Page title', className: 'text-2xl font-bold tracking-tight', sample: 'Exceptions' },
  {
    name: 'Section',
    className: 'text-lg font-bold tracking-tight',
    sample: 'Records side by side',
  },
  {
    name: 'Body',
    className: 'text-sm',
    sample: 'Ledger entry LED-7Q2K9 has no matching gateway payment.',
  },
  {
    name: 'Figure',
    className: 'text-[1.75rem] leading-none font-medium tabular-nums',
    sample: '$1,240,318.07',
  },
  {
    name: 'Label',
    className: 'text-xs font-medium text-muted-foreground',
    sample: 'Detected Nov 22, 8:14 AM',
  },
  {
    name: 'Identifier',
    className: 'font-mono text-[0.8125rem]',
    sample: 'pi_3QgT8aLk2 · LED-7Q2K9',
  },
];

export const TypeScale = () => (
  <dl className="divide-y rounded-md border bg-card">
    {TYPE_SCALE.map((row) => (
      <div key={row.name} className="grid gap-1 p-3 sm:grid-cols-[160px_1fr] sm:items-baseline">
        <dt className="text-xs text-muted-foreground">{row.name}</dt>
        <dd className={row.className}>{row.sample}</dd>
      </div>
    ))}
    <div className="grid gap-1 p-3 sm:grid-cols-[160px_1fr] sm:items-baseline">
      <dt className="text-xs text-muted-foreground">Tabular figures</dt>
      <dd className="space-y-0.5 text-right font-medium tabular-nums sm:max-w-48">
        <div>$11,111.11</div>
        <div>$48,812.50</div>
        <div>$9,000.00</div>
      </dd>
    </div>
  </dl>
);

export const ButtonsShowcase = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>
      <Link2 data-icon="inline-start" />
      Match records
    </Button>
    <Button variant="outline">
      <Download data-icon="inline-start" />
      Download CSV
    </Button>
    <Button variant="secondary">Add note</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Ignore exception</Button>
    <Button variant="link">
      View audit trail
      <ArrowRight data-icon="inline-end" />
    </Button>
    <Button disabled>
      <Spinner data-icon="inline-start" />
      Resolving…
    </Button>
    <Button size="icon" variant="outline" aria-label="Add filter">
      <Plus />
    </Button>
  </div>
);
