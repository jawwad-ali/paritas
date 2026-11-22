-- AlterEnum
ALTER TYPE "reconciliation_status" ADD VALUE 'EXCLUDED';

-- CreateIndex
CREATE INDEX "transactions_reconciliation_status_created_at_idx" ON "transactions"("reconciliation_status", "created_at");
