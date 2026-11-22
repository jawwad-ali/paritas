import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { PageContainer } from './page-container';
import { PageHeader } from './page-header';

interface PlannedScreenProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** What this screen will let people do, in one sentence. */
  purpose: string;
}

/** A screen whose API is ready and whose interface is built in the next phase. */
export const PlannedScreen = ({ title, description, icon: Icon, purpose }: PlannedScreenProps) => (
  <PageContainer>
    <PageHeader title={title} description={description} />
    <Empty className="border border-dashed bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>Screen in progress</EmptyTitle>
        <EmptyDescription>
          {purpose} The API behind it is live; this screen is next.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" asChild>
          <Link href="/design-system">Open the design system</Link>
        </Button>
      </EmptyContent>
    </Empty>
  </PageContainer>
);
