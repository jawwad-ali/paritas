/*
  Warnings:

  - Added the required column `last_event_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "last_event_at" TIMESTAMPTZ(3) NOT NULL;
