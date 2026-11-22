-- CreateEnum
CREATE TYPE "exception_transaction_role" AS ENUM ('SUBJECT', 'CONTEXT');

-- AlterTable
ALTER TABLE "exception_transactions" ADD COLUMN     "role" "exception_transaction_role" NOT NULL DEFAULT 'SUBJECT';
