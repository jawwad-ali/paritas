import type { ReactNode } from 'react';

interface DsSectionProps {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}

export const DsSection = ({ id, title, description, children }: DsSectionProps) => (
  <section aria-labelledby={`${id}-title`} className="scroll-mt-16 space-y-4 border-t pt-8">
    <div className="space-y-1">
      <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">
        {title}
      </h2>
      <p className="max-w-prose text-muted-foreground">{description}</p>
    </div>
    {children}
  </section>
);
