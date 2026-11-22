-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'MANAGER', 'OFFICER');

-- CreateEnum
CREATE TYPE "refresh_token_revoke_reason" AS ENUM ('ROTATED', 'LOGOUT', 'REUSE_DETECTED', 'PASSWORD_CHANGED', 'USER_DEACTIVATED');

-- CreateEnum
CREATE TYPE "source_kind" AS ENUM ('PAYMENT_GATEWAY', 'INTERNAL_LEDGER');

-- CreateEnum
CREATE TYPE "raw_event_status" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "reconciliation_status" AS ENUM ('UNMATCHED', 'MATCHED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "match_method" AS ENUM ('EXACT', 'FUZZY', 'MANUAL');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateEnum
CREATE TYPE "exception_type" AS ENUM ('MISSING', 'AMOUNT_MISMATCH', 'DUPLICATE', 'STATUS_CONFLICT', 'DELAYED', 'LOW_CONFIDENCE_MATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "exception_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "exception_status" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "exception_activity_type" AS ENUM ('CREATED', 'STATUS_CHANGED', 'SEVERITY_CHANGED', 'ASSIGNED', 'NOTE_ADDED', 'MANUALLY_MATCHED', 'REOPENED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_reason" "refresh_token_revoke_reason",
    "created_by_ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "source_kind" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_events" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "raw_event_status" NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "source_id" UUID NOT NULL,
    "raw_event_id" UUID,
    "external_id" TEXT NOT NULL,
    "reference" TEXT,
    "amount_minor" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "transaction_status" NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "customer_ref" TEXT,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "reconciliation_status" "reconciliation_status" NOT NULL DEFAULT 'UNMATCHED',
    "match_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "method" "match_method" NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'ACTIVE',
    "confidence" DOUBLE PRECISION NOT NULL,
    "score_breakdown" JSONB,
    "note" TEXT,
    "created_by_id" UUID,
    "reversed_by_id" UUID,
    "reversed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exceptions" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "type" "exception_type" NOT NULL,
    "severity" "exception_severity" NOT NULL,
    "status" "exception_status" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "dedupe_key" TEXT NOT NULL,
    "assignee_id" UUID,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(3),
    "resolution_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exception_transactions" (
    "exception_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,

    CONSTRAINT "exception_transactions_pkey" PRIMARY KEY ("exception_id","transaction_id")
);

-- CreateTable
CREATE TABLE "exception_activities" (
    "id" UUID NOT NULL,
    "exception_id" UUID NOT NULL,
    "actor_id" UUID,
    "type" "exception_activity_type" NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exception_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matching_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "amount_tolerance_minor" INTEGER NOT NULL,
    "amount_tolerance_bps" INTEGER NOT NULL,
    "time_window_minutes" INTEGER NOT NULL,
    "auto_match_threshold" DOUBLE PRECISION NOT NULL,
    "candidate_threshold" DOUBLE PRECISION NOT NULL,
    "missing_after_minutes" INTEGER NOT NULL,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "matching_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_is_active_idx" ON "users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE UNIQUE INDEX "sources_code_key" ON "sources"("code");

-- CreateIndex
CREATE INDEX "raw_events_status_received_at_idx" ON "raw_events"("status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "raw_events_source_id_external_event_id_key" ON "raw_events"("source_id", "external_event_id");

-- CreateIndex
CREATE INDEX "transactions_reference_idx" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_reconciliation_status_occurred_at_idx" ON "transactions"("reconciliation_status", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_source_id_occurred_at_idx" ON "transactions"("source_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_currency_amount_minor_occurred_at_idx" ON "transactions"("currency", "amount_minor", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_match_id_idx" ON "transactions"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_source_id_external_id_key" ON "transactions"("source_id", "external_id");

-- CreateIndex
CREATE INDEX "matches_method_created_at_idx" ON "matches"("method", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "exceptions_number_key" ON "exceptions"("number");

-- CreateIndex
CREATE UNIQUE INDEX "exceptions_dedupe_key_key" ON "exceptions"("dedupe_key");

-- CreateIndex
CREATE INDEX "exceptions_status_severity_created_at_idx" ON "exceptions"("status", "severity", "created_at");

-- CreateIndex
CREATE INDEX "exceptions_type_status_idx" ON "exceptions"("type", "status");

-- CreateIndex
CREATE INDEX "exceptions_assignee_id_status_idx" ON "exceptions"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "exceptions_created_at_idx" ON "exceptions"("created_at");

-- CreateIndex
CREATE INDEX "exception_transactions_transaction_id_idx" ON "exception_transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "exception_activities_exception_id_created_at_idx" ON "exception_activities"("exception_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_events" ADD CONSTRAINT "raw_events_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_raw_event_id_fkey" FOREIGN KEY ("raw_event_id") REFERENCES "raw_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_reversed_by_id_fkey" FOREIGN KEY ("reversed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exceptions" ADD CONSTRAINT "exceptions_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_transactions" ADD CONSTRAINT "exception_transactions_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_transactions" ADD CONSTRAINT "exception_transactions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_activities" ADD CONSTRAINT "exception_activities_exception_id_fkey" FOREIGN KEY ("exception_id") REFERENCES "exceptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exception_activities" ADD CONSTRAINT "exception_activities_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matching_config" ADD CONSTRAINT "matching_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Hand-written: invariants Prisma's schema language cannot express.
-- The database is the last line of defence; these hold even if app code is wrong.
-- ─────────────────────────────────────────────────────────────────────────────

-- Users: emails are normalised before insert.
ALTER TABLE "users"
  ADD CONSTRAINT "users_email_lowercase_chk" CHECK ("email" = lower(btrim("email")));

-- Transactions: positive money in minor units, ISO 4217 currency.
ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_amount_minor_positive_chk" CHECK ("amount_minor" >= 0),
  ADD CONSTRAINT "transactions_currency_iso4217_chk" CHECK ("currency" ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT "transactions_matched_has_match_chk"
    CHECK ("reconciliation_status" <> 'MATCHED' OR "match_id" IS NOT NULL);

-- Matches: confidence is a probability; a reversal records who and when.
ALTER TABLE "matches"
  ADD CONSTRAINT "matches_confidence_range_chk" CHECK ("confidence" >= 0 AND "confidence" <= 1),
  ADD CONSTRAINT "matches_reversal_consistent_chk"
    CHECK (("status" = 'REVERSED') = ("reversed_at" IS NOT NULL));

-- Exceptions: closed exceptions carry who closed them, when, and why.
ALTER TABLE "exceptions"
  ADD CONSTRAINT "exceptions_closure_consistent_chk" CHECK (
    ("status" IN ('RESOLVED', 'IGNORED'))
      = ("resolved_at" IS NOT NULL AND "resolution_reason" IS NOT NULL)
  );

-- Matching config: a single row with sane bounds.
ALTER TABLE "matching_config"
  ADD CONSTRAINT "matching_config_singleton_chk" CHECK ("id" = 1),
  ADD CONSTRAINT "matching_config_amount_tolerance_minor_chk" CHECK ("amount_tolerance_minor" >= 0),
  ADD CONSTRAINT "matching_config_amount_tolerance_bps_chk"
    CHECK ("amount_tolerance_bps" BETWEEN 0 AND 10000),
  ADD CONSTRAINT "matching_config_time_window_chk" CHECK ("time_window_minutes" > 0),
  ADD CONSTRAINT "matching_config_missing_after_chk" CHECK ("missing_after_minutes" > 0),
  ADD CONSTRAINT "matching_config_thresholds_chk" CHECK (
    "candidate_threshold" >= 0
    AND "candidate_threshold" <= "auto_match_threshold"
    AND "auto_match_threshold" <= 1
  );

-- Audit log: append-only. UPDATE, DELETE and TRUNCATE are rejected outright.
CREATE FUNCTION "audit_logs_reject_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% rejected)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "audit_logs_no_update_delete"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_reject_mutation"();

CREATE TRIGGER "audit_logs_no_truncate"
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_logs_reject_mutation"();
