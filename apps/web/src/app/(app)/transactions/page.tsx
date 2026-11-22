import type { Metadata } from 'next';
import { ArrowLeftRight } from 'lucide-react';
import { PlannedScreen } from '@/components/layout/planned-screen';

export const metadata: Metadata = { title: 'Transactions' };

const TransactionsPage = () => (
  <PlannedScreen
    title="Transactions"
    description="Every record from Stripe and the internal ledger, normalised."
    icon={ArrowLeftRight}
    purpose="Search and filter records by source, date, status and reconciliation state."
  />
);

export default TransactionsPage;
