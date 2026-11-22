import type { Metadata } from 'next';
import { ColorTokens } from '@/components/design-system/color-tokens';
import { DsSection } from '@/components/design-system/ds-section';
import { FiguresShowcase } from '@/components/design-system/figures-showcase';
import { FormsShowcase } from '@/components/design-system/forms-showcase';
import { StatesShowcase } from '@/components/design-system/states-showcase';
import { StatusShowcase } from '@/components/design-system/status-showcase';
import { TableShowcase } from '@/components/design-system/table-showcase';
import { ButtonsShowcase, TypeScale } from '@/components/design-system/type-and-buttons';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';

export const metadata: Metadata = { title: 'Design system' };

/** The living reference for every screen: tokens and components rendered by the real code. */
const DesignSystemPage = () => (
  <PageContainer>
    <PageHeader
      title="Design system"
      description="The tokens and components every Paritas screen is built from. Rows and figures here are illustrative."
    />
    <DsSection
      id="colour"
      title="Colour"
      description="Ocean Sunset carries the whole system: ink and petrol for the shell and actions, the sand-to-crimson run for severity. Every text pairing meets WCAG 2.2 AA."
    >
      <ColorTokens />
    </DsSection>
    <DsSection
      id="type"
      title="Type"
      description="Yantramanav throughout; its figures are tabular by design, so amounts align digit for digit. Identifiers are set in JetBrains Mono."
    >
      <TypeScale />
    </DsSection>
    <DsSection
      id="actions"
      title="Actions"
      description="One primary action per area. Buttons say what they do: a verb and the thing."
    >
      <ButtonsShowcase />
    </DsSection>
    <DsSection
      id="status"
      title="Status vocabulary"
      description="Severity is a four-step ladder with a tick meter, so it reads without colour. Every status carries an icon."
    >
      <StatusShowcase />
    </DsSection>
    <DsSection
      id="figures"
      title="Figures"
      description="Headline numbers carry a footnote key that says how they are computed."
    >
      <FiguresShowcase />
    </DsSection>
    <DsSection
      id="table"
      title="Queue table"
      description="Open exceptions carry their severity as a left edge; closed ones recede."
    >
      <TableShowcase />
    </DsSection>
    <DsSection
      id="forms"
      title="Forms"
      description="Visible labels, hints under the field, errors in words."
    >
      <FormsShowcase />
    </DsSection>
    <DsSection
      id="states"
      title="Loading, empty, error, feedback"
      description="Skeletons in the content's shape, empty states that say what to do next, errors with a retry and a request id, and confirmations for anything that cannot be undone silently."
    >
      <StatesShowcase />
    </DsSection>
  </PageContainer>
);

export default DesignSystemPage;
