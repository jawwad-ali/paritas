# Paritas

**Automated transaction reconciliation and data integrity engine.**

Companies that take payments through gateways like Stripe keep two copies of every
transaction: the gateway's record and their own. Those copies drift apart: missing
entries, fee-adjusted amounts, duplicates, conflicting statuses. Finance teams usually
find out at month-end and reconcile by hand. Paritas ingests transactions from every
source as they happen, matches them automatically, turns every discrepancy into a
trackable exception, and produces audit-ready reports.

> Status: **Phase 5 (Dashboard, reports, configurable rules)** complete. See the [roadmap](#roadmap).

## Architecture

```
            ┌──────────────┐   webhooks    ┌──────────────────────────────┐
  Stripe ──►│              │──────────────►│  NestJS API  (apps/api)      │
 (sandbox)  │   Sources    │               │  ingestion · matching ·      │
  Mock   ──►│              │               │  exceptions · reports        │
  ledger    └──────────────┘               └──────┬───────────────┬───────┘
                                                  │               │
                                           ┌──────▼─────┐  ┌──────▼──────┐
                                           │ PostgreSQL │  │ Redis       │
                                           │ (Prisma)   │  │ (BullMQ)    │
                                           └────────────┘  └─────────────┘
                                                  ▲
                                   REST + RFC 9457│errors
                                           ┌──────┴───────┐
                                           │ Next.js web  │
                                           │ (apps/web)   │
                                           └──────────────┘
```

| Path              | What it is                                                          |
| ----------------- | ------------------------------------------------------------------- |
| `apps/api`        | NestJS 12 API (ESM): auth, users, audit, health, error contract.    |
| `apps/web`        | Next.js 16 App Router frontend (Tailwind CSS).                      |
| `packages/shared` | Contracts shared by API and web: Zod schemas, DTO types, constants. |

### Data model

```
users ─┬─< refresh_tokens            sources ─┬─< raw_events
       │                                      └─< transactions >─ matches
       └─ (actor of) matches, exceptions,                │
          exception_activities, matching_config          └─< exception_transactions >─ exceptions ─< exception_activities

audit_logs   (append-only, no foreign keys: history outlives what it describes)
matching_config   (single row: tolerances, time window, confidence thresholds)
```

- **Money** is stored as integer minor units (`BIGINT` cents), never floating point.
- **UUIDv7** primary keys: time-ordered, so inserts stay cheap on B-tree indexes.
- **Ingestion is idempotent**: `raw_events (source_id, external_event_id)` is unique, so a
  webhook delivered twice is stored once.
- **Invariants live in the database too**: CHECK constraints guard currency codes,
  positive amounts, confidence in [0, 1], consistent closure of exceptions, and the
  single-row matching config. A trigger rejects `UPDATE`, `DELETE` and `TRUNCATE` on
  `audit_logs`.

### Authentication and authorization

| Piece          | Design                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Passwords      | Argon2id (OWASP parameters). Unknown emails cost the same time as wrong passwords.                  |
| Access token   | JWT (HS256, 15 min), sent as `Authorization: Bearer`. Algorithm, issuer, audience pinned.           |
| Refresh token  | 256-bit opaque token in an `httpOnly` cookie scoped to `/api/v1/auth`; only its SHA-256 is stored.  |
| Rotation       | Every refresh issues a new token. Replaying an old one revokes the whole session (theft detection). |
| CSRF           | Cookie endpoints require an `x-requested-by: paritas-web` header (blocked cross-site by CORS).      |
| Secure default | Every route requires a valid token unless marked `@Public()`; `@Roles()` restricts by role.         |
| Brute force    | Login limited to 10 attempts per minute per IP; global rate limit on everything else.               |

Roles: **Admin** (users, sources, matching rules), **Manager** (monitors health, reads audit
trail), **Officer** (works exceptions).

### Audit trail

Every important action is written to `audit_logs` with the actor, the entity, a
`{ before, after }` diff and the request context (`requestId`, IP, user agent). Changes and
their audit records are written in the same database transaction, so one never exists
without the other. Logged today: sign-in (success and failure, with reason), sign-out,
refresh-token reuse, password change, user creation and updates, source enable/disable,
raw-event replays and simulator runs.

### Ingestion pipeline

```
 Stripe ──webhook──►┐                        ┌──────────── worker (BullMQ, retries) ────────────┐
                    ├─► verify signature ─► raw_events ─► normaliser ─► transactions ─► reconciliation
 Ledger ──webhook──►┘   (HMAC, 5-min window)  (idempotent)  (per source)  (ordered upsert)   queue
```

1. **Receive** (`POST /api/v1/webhooks/{stripe|internal-ledger}`): verify the signature over
   the exact bytes received, store the untouched payload in `raw_events`, enqueue a job, answer
   `200` in milliseconds. A redelivered event hits the `(source, external_event_id)` unique key
   and is acknowledged as a duplicate without being processed twice.
2. **Normalise** (worker): a per-source normaliser maps the payload to the common format
   (integer cents, ISO currency, `PENDING | SUCCEEDED | FAILED | REFUNDED`, lower-cased customer
   email). Malformed payloads fail immediately; transient errors retry with exponential backoff.
3. **Write**: upsert by `(source, external_id)` with last-writer-wins on the _source's_ event
   time, so out-of-order webhooks can never roll a payment backwards. Refund events change only
   the status, never the original amount or time.
4. **Hand off**: every changed transaction is queued for the matching engine.

Safety nets: a scheduled sweeper re-enqueues raw events that never got a job (e.g. Redis was
briefly down); admins can replay `FAILED`/`IGNORED` events; live-mode Stripe events and live
API keys are refused; a disabled source still has its events stored for audit.

| Source          | Events reconciled                                                                                                        | Auth                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Stripe          | `payment_intent.succeeded`, `.processing`, `.payment_failed`, `.canceled`, `charge.refunded`                             | `Stripe-Signature` (webhook secret)                              |
| Internal ledger | `ledger.entry.recorded`, `ledger.entry.updated` (schema: `apps/api/src/modules/ingestion/ledger/ledger-event.schema.ts`) | `x-paritas-signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">` |

### Matching engine

Every created or changed transaction is evaluated against the other side (gateway ↔ ledger):

1. **Duplicates**: the same reference recorded twice by one source → `DUPLICATE`. The earliest
   record stays eligible to match; the copies are held as exceptions.
2. **Exact match**: same reference on both sides → candidate pair with confidence `1.0`.
3. **Fuzzy match** (no shared reference): candidates in the same currency, within the time
   window and the amount tolerance are scored, and every score is stored with its breakdown:

   | Signal   | Weight | Scoring                                                                  |
   | -------- | ------ | ------------------------------------------------------------------------ |
   | Amount   | 0.45   | 1.0 when identical, falling linearly to 0.5 at the edge of the tolerance |
   | Customer | 0.30   | 1.0 same customer, 0.0 different, 0.5 when either side is unknown        |
   | Time     | 0.25   | 1.0 same moment, falling linearly to 0.0 at the edge of the window       |

   ≥ auto-match threshold and unambiguous → `FUZZY` match. Between the candidate and auto-match
   thresholds, or with a near-tie runner-up → `LOW_CONFIDENCE_MATCH` for a person to review.

4. **Verdict on the pair**: different currency → `OTHER`; either side pending → wait (then
   `DELAYED`); different statuses → `STATUS_CONFLICT`; amount beyond tolerance →
   `AMOUNT_MISMATCH`; otherwise the pair is matched.
5. **Time-based checks** (sweep every minute, after a grace period): one-sided record →
   `MISSING`; still pending → `DELAYED`; a declined payment nobody booked → `EXCLUDED` (nothing
   to reconcile).

Tolerance = `max(fixed cents, basis points × amount)`, defaults 50¢ / 3% (absorbs Stripe's
2.9% + 30¢). Defaults: 120-minute window, auto-match ≥ 0.85, candidates ≥ 0.65, missing after 60
minutes. All rules live in the `matching_config` row, are edited by an admin through
`PATCH /api/v1/settings/matching` (validated, audited with before/after values) and apply to the
next evaluation without a restart.

**Self-healing**: when records come to agree (a late counterpart arrives, the ledger books a
refund, an amount is corrected), the engine matches them and auto-resolves the related
`MISSING`/`DELAYED`/`STATUS_CONFLICT`/`AMOUNT_MISMATCH` exceptions, with a timeline entry. An
exception a person closed is never reopened by the engine.

**Severity**: ledger revenue with no gateway payment, or "booked as paid but the payment
failed" → `CRITICAL`; money received but not booked, duplicates, large mismatches → `HIGH`;
smaller mismatches and delays → `MEDIUM`; review suggestions → `LOW`. Payments of $1,000+ are
escalated one level.

**Correctness under concurrency**: evaluations are serialised per currency with a PostgreSQL
transaction-scoped advisory lock, so parallel workers on any number of replicas can never pair
the same record twice. Each evaluation is idempotent and re-reads state under the lock. A
transaction's status is derived by one rule after every decision (open exception as subject →
`EXCEPTION`, else active match → `MATCHED`, else `EXCLUDED` if it was excluded, else
`UNMATCHED`), so it cannot drift.

**Waiting for the exact counterpart first**: a record that carries a reference is not
fuzzy-matched until a 2-minute settle window has passed, so a slightly late exact counterpart
always wins over a guess.

Verified with 600 simulated payments in three concurrent runs: every scenario landed in exactly
the expected match or exception, with zero invariant violations.

### Exception management

Exceptions are the work queue for what the engine could not settle. People browse them (filter
by status, type, severity, source, assignee and date; search by `EX-1042`, title, reference,
external id or customer; sort by priority, newest or oldest), open one to see the records side
by side with the full timeline, and act on it:

```
OPEN ──investigate──► INVESTIGATING
OPEN | INVESTIGATING ──resolve | match──► RESOLVED
OPEN | INVESTIGATING ──ignore──► IGNORED
RESOLVED | IGNORED ──reopen──► OPEN
```

| Action                                                        | Who                                                                                         | Effect on the records                                                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Add note                                                      | anyone                                                                                      | Timeline only                                                                                                         |
| Assign                                                        | Officers take unassigned / release their own; managers and admins assign anyone             | Timeline only                                                                                                         |
| Change severity                                               | Manager, Admin (with a reason)                                                              | Timeline only                                                                                                         |
| Investigate                                                   | anyone (self-assigns when unassigned)                                                       | None                                                                                                                  |
| **Manual match**                                              | anyone (with a reason)                                                                      | A `MANUAL` match links the gateway and ledger record; the engine re-checks the pair at once                           |
| Resolve / Ignore                                              | anyone (ignoring a `CRITICAL` one needs a manager or admin); reason required, note optional | Unmatched subjects become `EXCLUDED`: accounted for by a person, no longer chased by the engine                       |
| Reject a suggestion (resolve/ignore a `LOW_CONFIDENCE_MATCH`) | anyone                                                                                      | Both records return to `UNMATCHED`; that pair is never proposed again, so they find another match or become `MISSING` |
| Reopen                                                        | anyone (with a reason)                                                                      | Subjects are held in `EXCEPTION` again                                                                                |

Design decisions:

- **A manual match asserts identity, not agreement.** After linking, the engine re-validates the
  pair: it auto-resolves what the match settles (e.g. the counterpart's own `MISSING`), and a real
  difference (amount beyond tolerance, status conflict) still surfaces as its own exception.
- **Manual-match suggestions** (`GET /transactions/:id/match-candidates`) use the engine's own
  scoring with relaxed limits (3-day window, 20% tolerance), so a person can judge records the
  engine would never pair on its own. A shared reference always ranks first.
- **People and the engine never decide at the same time.** Every status change takes the same
  per-currency advisory lock as the engine and re-reads under it; updates are conditional on the
  status read, so two people acting at once get one success and one `409 Conflict`.
- **Everything is on the record.** Each action appends to the exception's timeline and writes an
  audit entry in the same database transaction. The closure fields (`resolvedAt`,
  `resolutionReason`) are set on close and cleared on reopen, enforced by a `CHECK` constraint.
- An `EXCLUDED` record can still be matched by the engine if a genuine counterpart arrives later.

### Dashboard and reports

`GET /api/v1/dashboard/overview?period=7d|30d&timeZone=America/New_York` returns everything the
dashboard renders in one request: records and match rate (overall and per source), successful
payment volume per currency, exceptions detected and closed (with the median time to close),
what is open right now (by severity and type, critical, unassigned), a zero-filled daily trend,
and the five most urgent open exceptions.

| Report                 | Endpoint                                     | Formats        |
| ---------------------- | -------------------------------------------- | -------------- |
| Reconciliation summary | `GET /api/v1/reports/reconciliation-summary` | JSON, CSV, PDF |
| Exception detail       | `GET /api/v1/reports/exceptions`             | CSV, PDF       |

Both take `from` and `to` (calendar days, inclusive, at most 366) and a `timeZone`; the exception
report also filters by status, type, severity and source.

Design decisions:

- **Days belong to a time zone.** A US team's "Nov 3" is not UTC's. PostgreSQL turns calendar
  days into exact instants (`AT TIME ZONE`), so daylight-saving days of 23 or 25 hours are
  counted correctly.
- **Match rate** = matched records / (all records − excluded records). Declined payments that
  nobody booked, and records a person accounted for, are not failures to reconcile.
- **Volumes are per currency**: amounts in different currencies are never added together.
- **The exception CSV streams** in keyset-paginated batches, so memory stays flat for any size.
  A PDF is capped at 1,000 rows and refuses beyond that instead of silently truncating an
  audit document.
- **Safe to open in Excel**: cells that would run as formulas (`=`, `+`, `-`, `@`) are
  neutralised (OWASP CSV injection), and a UTF-8 byte-order mark keeps names intact.
- **PDFs are print-ready**: US Letter, numbered pages, repeated table headers, generated-by and
  time zone on the cover.
- **Reports leave the system, so they are audited** (`report.export`: who, which report, period,
  filters, row count), sent with `Cache-Control: no-store`, and rate-limited to 30 per minute.

### Simulator (demo data)

`POST /api/v1/simulator/runs` (Admin) plays both the merchant's checkout and its internal ledger,
and injects realistic discrepancies so every exception type can be demonstrated:

| Scenario               | What happens                                                   |
| ---------------------- | -------------------------------------------------------------- |
| `EXACT_MATCH`          | Both sides agree and share the Stripe PaymentIntent id         |
| `FEE_WITHIN_TOLERANCE` | Ledger booked the amount net of a small fee (within tolerance) |
| `FUZZY_MATCH`          | Ledger lacks the reference; amount, time and customer agree    |
| `MISSING_IN_LEDGER`    | Paid at Stripe, never recorded internally                      |
| `MISSING_AT_GATEWAY`   | Recorded internally, Stripe has no such payment                |
| `AMOUNT_MISMATCH`      | Ledger booked the pre-discount total                           |
| `DUPLICATE_IN_LEDGER`  | Ledger recorded the same payment twice                         |
| `STATUS_CONFLICT`      | Card declined at Stripe, ledger says succeeded                 |
| `DELAYED_SETTLEMENT`   | Stripe still processing, ledger pending                        |

```json
{ "count": 50, "anomalyRate": 0.3, "spreadHours": 6, "gateway": "synthetic" }
```

- `synthetic` (default): Stripe-shaped test events are generated locally. No Stripe account needed.
- `stripe`: creates real PaymentIntents in Stripe **test mode** (`STRIPE_SECRET_KEY`, preferably a
  restricted `rk_test_` key); Stripe then sends the webhooks. Forward them locally with the CLI:

  ```bash
  npm i -g @stripe/cli
  stripe sandbox create          # or `stripe login` with an existing account
  stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe
  # copy the printed whsec_… into STRIPE_WEBHOOK_SECRET and restart the API
  ```

The simulator is disabled unless `SIMULATOR_ENABLED=true`; never enable it in production.

## Getting started

Prerequisites: Node.js 24+, pnpm 10, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env          # then set JWT_ACCESS_SECRET (see the comment in the file)
cp apps/web/.env.example apps/web/.env.local

pnpm infra:up     # PostgreSQL (localhost:5433) + Redis (localhost:6380)
pnpm db:migrate   # apply migrations
pnpm db:seed      # sources, default matching rules, demo users
# then: sign in as admin and POST /api/v1/simulator/runs to generate demo payments
pnpm dev          # API on :4000, web on :3000
```

Or run everything in containers (migrations and seed run automatically):

```bash
pnpm stack:up
```

### Demo accounts (local only)

| Role    | Email                         | Password            |
| ------- | ----------------------------- | ------------------- |
| Admin   | `admin@paritas.example.com`   | `Paritas-Demo-2026` |
| Manager | `manager@paritas.example.com` | `Paritas-Demo-2026` |
| Officer | `officer@paritas.example.com` | `Paritas-Demo-2026` |

The password comes from `SEED_DEMO_PASSWORD` in `apps/api/.env`.

| URL                                    | What                 |
| -------------------------------------- | -------------------- |
| http://localhost:3000                  | Web app              |
| http://localhost:4000/api/docs         | OpenAPI (Swagger) UI |
| http://localhost:4000/api/health/ready | Readiness probe      |

### API at a glance

| Method & path                                   | Who            | What                                     |
| ----------------------------------------------- | -------------- | ---------------------------------------- |
| `POST /api/v1/auth/login`                       | anyone         | Sign in                                  |
| `POST /api/v1/auth/refresh`                     | cookie         | New access token (rotates the cookie)    |
| `POST /api/v1/auth/logout`                      | cookie         | End the session                          |
| `GET /api/v1/auth/me`                           | signed in      | Current user                             |
| `POST /api/v1/auth/change-password`             | signed in      | Change password, sign out other sessions |
| `GET/POST /api/v1/users`                        | Admin          | List / create users                      |
| `GET/PATCH /api/v1/users/:id`                   | Admin          | Read / update name, role, active status  |
| `GET /api/v1/audit-logs`                        | Admin, Manager | Search the audit trail                   |
| `GET /api/v1/transactions`                      | signed in      | Normalised transactions, filterable      |
| `GET /api/v1/transactions/:id`                  | signed in      | One transaction + its raw source event   |
| `GET /api/v1/sources`                           | signed in      | Sources with volume and last activity    |
| `PATCH /api/v1/sources/:id`                     | Admin          | Enable / disable a source                |
| `GET /api/v1/raw-events[/:id]`                  | Admin, Manager | Inbound events as received               |
| `POST /api/v1/raw-events/:id/replay`            | Admin          | Re-process a failed or ignored event     |
| `GET /api/v1/transactions/:id/match-candidates` | signed in      | Suggestions for a manual match           |
| `GET /api/v1/exceptions`                        | signed in      | Browse: filter, search, sort, paginate   |
| `GET /api/v1/exceptions/stats`                  | signed in      | Counts for queue tabs and badges         |
| `GET /api/v1/exceptions/assignees`              | signed in      | Active users to assign to                |
| `GET /api/v1/exceptions/:id`                    | signed in      | Records side by side + timeline          |
| `POST /api/v1/exceptions/:id/notes`             | signed in      | Add a note                               |
| `PATCH /api/v1/exceptions/:id/assignee`         | signed in      | Assign / unassign (see rules above)      |
| `PATCH /api/v1/exceptions/:id/severity`         | Admin, Manager | Change severity with a reason            |
| `POST /api/v1/exceptions/:id/investigate`       | signed in      | Start investigating                      |
| `POST /api/v1/exceptions/:id/resolve`           | signed in      | Resolve with a reason                    |
| `POST /api/v1/exceptions/:id/ignore`            | signed in      | Ignore with a reason                     |
| `POST /api/v1/exceptions/:id/reopen`            | signed in      | Reopen with a reason                     |
| `POST /api/v1/exceptions/:id/match`             | signed in      | Manually match two records and close     |
| `GET /api/v1/dashboard/overview`                | signed in      | Dashboard metrics, trend, priority list  |
| `GET /api/v1/reports/reconciliation-summary`    | signed in      | Summary report (JSON, CSV, PDF)          |
| `GET /api/v1/reports/exceptions`                | signed in      | Exception report (CSV, PDF)              |
| `GET /api/v1/settings/matching`                 | signed in      | Current matching rules                   |
| `PATCH /api/v1/settings/matching`               | Admin          | Change matching rules (audited)          |
| `POST /api/v1/simulator/runs`                   | Admin          | Generate demo payments with anomalies    |
| `POST /api/v1/webhooks/stripe`                  | Stripe         | Stripe events (signature-verified)       |
| `POST /api/v1/webhooks/internal-ledger`         | Ledger         | Ledger events (HMAC-verified)            |

### Useful scripts

| Command           | Does                                     |
| ----------------- | ---------------------------------------- |
| `pnpm dev`        | Run all apps in watch mode (Turborepo)   |
| `pnpm build`      | Build every package                      |
| `pnpm lint`       | Lint every package                       |
| `pnpm typecheck`  | Type-check every package                 |
| `pnpm infra:up`   | Start PostgreSQL + Redis                 |
| `pnpm db:migrate` | Create/apply migrations (development)    |
| `pnpm db:seed`    | Load idempotent demo data                |
| `pnpm db:studio`  | Browse the database in Prisma Studio     |
| `pnpm stack:up`   | Build and start the full stack in Docker |

## Roadmap

- [x] **Phase 0**: Foundation (monorepo, config, logging, health, errors, Docker)
- [x] **Phase 1**: Data model, authentication and roles, audit log
- [x] **Phase 2**: Transaction ingestion (Stripe webhooks, mock internal ledger)
- [x] **Phase 3**: Matching engine (exact, fuzzy, confidence scoring, anomaly detection)
- [x] **Phase 4**: Exception management workflow (queue, investigation, manual match, audit)
- [x] **Phase 5**: Dashboard metrics, reports and export (CSV, PDF), configurable rules
- [ ] **Phase 6**: Frontend design system
- [ ] **Phase 7**: Frontend screens

## License

MIT
