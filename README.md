# Paritas

![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat-square&logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

**Automated transaction reconciliation for finance teams.** Paritas checks every Stripe payment
against the company's own ledger as it happens, matches the two records automatically, and turns
every difference into a tracked case that a person can investigate and close.

## At a Glance

- A company that takes card payments keeps two copies of every sale: Stripe's record and its own
  ledger entry. Those copies drift apart (a missing entry, a fee taken off the amount, a duplicate,
  a declined card booked as paid), and finance teams usually find out at month-end.
- Paritas receives both sides through webhooks, matches them within seconds (exactly by reference,
  or by a score on amount, customer and time), and opens an **exception** for anything that does
  not agree.
- Finance staff work those exceptions in a web app: both records side by side, a timeline, a
  required reason for every decision, and a full audit trail.
- It is a TypeScript monorepo: a NestJS API with PostgreSQL and Redis queues, and a Next.js web app,
  all runnable with one Docker command.

**Contents:** [Getting Started](#getting-started) · [What This Project Does](#what-this-project-does)
· [The Problem It Solves](#the-problem-it-solves) · [How It Works](#how-it-works-architecture) ·
[Tech Stack and Why](#tech-stack-and-why) · [Main Features](#main-features-and-how-they-work) ·
[Request / Response Flow](#request--response-flow) ·
[Key Decisions](#key-technical-decisions-and-trade-offs) ·
[Challenges](#challenges-and-how-they-were-solved) · [Future Improvements](#future-improvements) ·
[API at a Glance](#api-at-a-glance) · [Roadmap](#roadmap)

## What This Project Does

1. **Collects transactions** from two sources: Stripe (the payment gateway) and an internal ledger
   (the company's own books). Each source sends events to a signed webhook.
2. **Matches them.** A matching engine pairs each gateway payment with its ledger entry and scores
   how confident it is.
3. **Flags problems.** Anything that does not agree becomes an exception with a type (missing,
   amount mismatch, duplicate, status conflict, delayed, needs review) and a severity.
4. **Supports the people who fix them.** A queue, an investigation screen, manual matching,
   assignment, notes and reasons, all recorded in an append-only audit log.
5. **Reports on it.** A live dashboard and downloadable CSV and PDF reports for any date range, in
   the viewer's own time zone.

A built-in simulator generates realistic payments with injected mistakes, so every case can be
demonstrated without a real business behind it.

## The Problem It Solves

- **Reconciliation is manual and late.** Teams export spreadsheets at month-end and compare rows
  by hand. Problems are found weeks after they happened, when they are hardest to fix.
- **The two records rarely agree exactly.** Stripe takes a fee (2.9% + 30¢), so the ledger may book
  a slightly different amount; one side may record the sale minutes later; the ledger often has no
  Stripe reference at all. A simple "same id, same amount" check fails on most real payments.
- **Mistakes cost money and trust.** Revenue booked for a payment that never arrived, money
  received but never booked, a customer charged twice: each one is a financial or audit risk.
- **Decisions need a record.** Auditors ask who decided what, when and why. Spreadsheets do not
  answer that.

Paritas makes reconciliation continuous (minutes, not weeks), tolerant of normal differences
(fees, timing, missing references), and accountable (every decision has an actor and a reason).

## How It Works (Architecture)

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

| Path              | What it is                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| `apps/api`        | NestJS 12 API (ESM): ingestion, matching engine, exceptions, reports, auth. |
| `apps/web`        | Next.js 16 App Router web app (Tailwind CSS 4, shadcn/ui).                  |
| `packages/shared` | Contracts used by both: Zod schemas, DTO types, constants, money helpers.   |

The main parts and how they talk:

- **Webhook endpoints** accept events, verify their signatures, save the untouched payload and
  answer at once. The real work happens later in background **workers**.
- **Redis + BullMQ** carry two job queues: "process this raw event" and "match this transaction".
  Jobs retry with backoff, so a short database or network problem does not lose data.
- **PostgreSQL** holds everything, including rules the database itself enforces (CHECK constraints,
  unique keys, a trigger that makes the audit log append-only).
- **The web app** is a pure client of the REST API. It never talks to the database. Errors follow
  one format (RFC 9457 "problem details") so the UI can show them consistently.
- **The shared package** holds the request schemas. The API validates with them and the web forms
  validate with the same ones, so the two can never disagree about what is valid.

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
- **Ingestion is idempotent** (safe to repeat): `raw_events (source_id, external_event_id)` is
  unique, so a webhook delivered twice is stored once.
- **Invariants live in the database too**: CHECK constraints guard currency codes, positive
  amounts, confidence in [0, 1], consistent closure of exceptions and the single-row matching
  config. A trigger rejects `UPDATE`, `DELETE` and `TRUNCATE` on `audit_logs`.

## Tech Stack and Why

| Technology                        | Used for                                 | Why it was chosen                                                                                                                                                                |
| --------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript** (Node.js 24)       | Everything                               | One language across API, web and shared contracts; types catch contract drift at build time.                                                                                     |
| **pnpm workspaces + Turborepo**   | Monorepo                                 | The shared package is used by both apps without publishing it; Turborepo runs build, lint and typecheck in dependency order with caching.                                        |
| **NestJS 12**                     | API                                      | Modules, dependency injection and guards give a clear place for each concern: a global auth guard (every route private unless marked `@Public()`), `@Roles()`, validation pipes. |
| **PostgreSQL 18**                 | Database                                 | Transactions, CHECK constraints, advisory locks (used to stop two workers pairing the same record) and time-zone maths (`AT TIME ZONE`) for reports.                             |
| **Prisma 7** (pg driver adapter)  | Data access and migrations               | Typed queries generated from one schema file, versioned SQL migrations; the pure-JS `pg` adapter means the running API ships no database engine binary.                          |
| **Redis 8 + BullMQ**              | Background jobs                          | Webhooks must answer in milliseconds; BullMQ gives retries with exponential backoff, de-duplicated job ids and scheduled sweeps.                                                 |
| **Zod 4**                         | Validation                               | One schema validates a request in the API and the same form in the browser (through `@paritas/shared`).                                                                          |
| **JWT + rotating refresh cookie** | Sign-in sessions                         | Short-lived access token in memory, long-lived refresh token in an `httpOnly` cookie that JavaScript cannot read; rotation detects a stolen token.                               |
| **Argon2id** (`@node-rs/argon2`)  | Password hashing                         | The algorithm OWASP recommends, with its recommended cost parameters pinned in code.                                                                                             |
| **Stripe SDK**                    | Webhook verification, test-mode payments | Stripe is the gateway being reconciled; its SDK verifies webhook signatures over the exact bytes received.                                                                       |
| **pdfkit**                        | PDF reports                              | Generates PDFs in-process, with no headless browser to install or run.                                                                                                           |
| **Next.js 16** (App Router)       | Web app                                  | File-based routing, static shells for every page (fast first paint), and a standalone server build for a small Docker image.                                                     |
| **TanStack Query 5**              | Server data in the browser               | Caching, background refresh (the dashboard follows the engine once a minute) and cache invalidation after each action.                                                           |
| **Tailwind CSS 4 + shadcn/ui**    | Styling and components                   | Accessible Radix-based components (dialogs, menus, focus handling) styled with the project's own design tokens.                                                                  |
| **Docker + Docker Compose**       | Local stack and deployable images        | One command starts PostgreSQL, Redis, a migration job, the API and the web app.                                                                                                  |

## Main Features and How They Work

### 1. Ingestion pipeline

**What you see:** payments appear on the Transactions screen within seconds; the Inbound events
screen shows every webhook exactly as it arrived, and an admin can replay a failed one.

**What the code does:**

```
 Stripe ──webhook──►┐                        ┌──────────── worker (BullMQ, retries) ────────────┐
                    ├─► verify signature ─► raw_events ─► normaliser ─► transactions ─► reconciliation
 Ledger ──webhook──►┘   (HMAC, 5-min window)  (idempotent)  (per source)  (ordered upsert)   queue
```

1. **Receive** (`POST /api/v1/webhooks/{stripe|internal-ledger}`): verify the signature over the
   exact bytes received, store the untouched payload in `raw_events`, enqueue a job, answer `200`
   in milliseconds. A redelivered event hits the `(source, external_event_id)` unique key and is
   acknowledged as a duplicate without being processed twice.
2. **Normalise** (worker): a per-source normaliser maps the payload to one common format (integer
   cents, ISO currency, `PENDING | SUCCEEDED | FAILED | REFUNDED`, lower-cased customer email).
   Malformed payloads fail at once; temporary errors retry with exponential backoff.
3. **Write**: upsert by `(source, external_id)`, where the newest event by the _source's_ own clock
   wins, so out-of-order webhooks can never roll a payment backwards. A refund changes only the
   status, never the original amount or time.
4. **Hand off**: every changed transaction is queued for the matching engine.

Safety nets: a scheduled sweeper re-enqueues raw events that never got a job (for example while
Redis was briefly down); admins can replay `FAILED`/`IGNORED` events; live-mode Stripe events and
live API keys are refused; a disabled source still has its events stored for audit.

| Source          | Events reconciled                                                                                                        | Auth                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Stripe          | `payment_intent.succeeded`, `.processing`, `.payment_failed`, `.canceled`, `charge.refunded`                             | `Stripe-Signature` (webhook secret)                              |
| Internal ledger | `ledger.entry.recorded`, `ledger.entry.updated` (schema: `apps/api/src/modules/ingestion/ledger/ledger-event.schema.ts`) | `x-paritas-signature: t=<unix>,v1=<hex HMAC-SHA256 of "t.body">` |

### 2. Matching engine

**What you see:** most payments show as Matched without anyone touching them; the rest show up in
the exception queue with a plain-words explanation and, for suggestions, a score breakdown.

**What the code does:** every created or changed transaction is checked against the other side
(gateway ↔ ledger):

1. **Duplicates**: the same reference recorded twice by one source → `DUPLICATE`. The earliest
   record stays eligible to match; the copies are held as exceptions.
2. **Exact match**: same reference on both sides → candidate pair with confidence `1.0`.
3. **Fuzzy match** (no shared reference): records in the same currency, within the time window and
   the amount tolerance, are scored, and every score is stored with its breakdown:

   | Signal   | Weight | Scoring                                                                  |
   | -------- | ------ | ------------------------------------------------------------------------ |
   | Amount   | 0.45   | 1.0 when identical, falling linearly to 0.5 at the edge of the tolerance |
   | Customer | 0.30   | 1.0 same customer, 0.0 different, 0.5 when either side is unknown        |
   | Time     | 0.25   | 1.0 same moment, falling linearly to 0.0 at the edge of the window       |

   At or above the auto-match threshold and unambiguous → `FUZZY` match. Between the candidate and
   auto-match thresholds, or with a near-tie runner-up → `LOW_CONFIDENCE_MATCH` for a person to
   review.

4. **Verdict on the pair**: different currency → `OTHER`; either side pending → wait (then
   `DELAYED`); different statuses → `STATUS_CONFLICT`; amount beyond tolerance →
   `AMOUNT_MISMATCH`; otherwise the pair is matched.
5. **Time-based checks** (a sweep every minute, after a grace period): one-sided record →
   `MISSING`; still pending → `DELAYED`; a declined payment nobody booked → `EXCLUDED` (nothing to
   reconcile).

Tolerance = `max(fixed cents, basis points × amount)`, defaults 50¢ / 3% (absorbs Stripe's 2.9% +
30¢). Defaults: 120-minute window, auto-match ≥ 0.85, candidates ≥ 0.65, missing after 60 minutes.
All rules live in the `matching_config` row, are edited by an admin on the Matching rules screen
(`PATCH /api/v1/settings/matching`, validated and audited with before/after values) and apply to
the next evaluation without a restart.

- **Self-healing:** when records come to agree (a late counterpart arrives, the ledger books a
  refund, an amount is corrected), the engine matches them and auto-resolves the related
  `MISSING`/`DELAYED`/`STATUS_CONFLICT`/`AMOUNT_MISMATCH` exceptions, with a timeline entry. An
  exception a person closed is never reopened by the engine.
- **Severity:** ledger revenue with no gateway payment, or "booked as paid but the payment
  failed" → `CRITICAL`; money received but not booked, duplicates, large mismatches → `HIGH`;
  smaller mismatches and delays → `MEDIUM`; review suggestions → `LOW`. Payments of $1,000 or more
  move up one level.
- **Status never drifts:** a transaction's status is derived by one rule after every decision
  (open exception → `EXCEPTION`, else active match → `MATCHED`, else `EXCLUDED` if it was excluded,
  else `UNMATCHED`).

Verified with 600 simulated payments in three concurrent runs: every scenario landed in exactly
the expected match or exception, with zero rule violations.

### 3. Exception management

**What you see:** a queue with Open, Assigned to me, Unassigned, Closed and All views; filters for
status, type, severity, source, assignee and date; search by `EX-1042`, reference or customer. Open
one and the two records sit side by side with a centre rail marking each field as agreeing or
differing, the full timeline, notes, and a decision panel.

**What the code does:** a small state machine, checked on every action:

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
| Resolve / Ignore                                              | anyone (ignoring a `CRITICAL` one needs a manager or admin); reason required, note optional | Unmatched records become `EXCLUDED`: accounted for by a person, no longer chased by the engine                        |
| Reject a suggestion (resolve/ignore a `LOW_CONFIDENCE_MATCH`) | anyone                                                                                      | Both records return to `UNMATCHED`; that pair is never proposed again, so they find another match or become `MISSING` |
| Reopen                                                        | anyone (with a reason)                                                                      | The records are held in `EXCEPTION` again                                                                             |

- **A manual match asserts identity, not agreement.** After linking, the engine re-checks the pair:
  it auto-resolves what the match settles (for example the counterpart's own `MISSING`), and a real
  difference (amount beyond tolerance, status conflict) still surfaces as its own exception.
- **Match suggestions** (`GET /transactions/:id/match-candidates`) use the engine's own scoring with
  relaxed limits (3-day window, 20% tolerance), so a person can judge records the engine would
  never pair on its own. A shared reference always ranks first.
- **Everything is on the record.** Each action appends to the exception's timeline and writes an
  audit entry in the same database transaction. The closure fields (`resolvedAt`,
  `resolutionReason`) are set on close and cleared on reopen, enforced by a `CHECK` constraint.

### 4. Dashboard and reports

**What you see:** the last 7 or 30 days in your own time zone: records and match rate, open and
critical exceptions, median time to close, the five most urgent exceptions, charts per day, match
rate per source, volume per currency. The Reports screen previews the summary and downloads CSV or
PDF files.

**What the code does:** `GET /api/v1/dashboard/overview?period=7d|30d&timeZone=…` returns everything
the dashboard draws in one request.

| Report                 | Endpoint                                     | Formats        |
| ---------------------- | -------------------------------------------- | -------------- |
| Reconciliation summary | `GET /api/v1/reports/reconciliation-summary` | JSON, CSV, PDF |
| Exception detail       | `GET /api/v1/reports/exceptions`             | CSV, PDF       |

Both take `from` and `to` (calendar days, inclusive, at most 366) and a `timeZone`; the exception
report also filters by status, type, severity and source.

- **Days belong to a time zone.** A US team's "Nov 3" is not UTC's. PostgreSQL turns calendar days
  into exact instants (`AT TIME ZONE`), so daylight-saving days of 23 or 25 hours count correctly.
- **Match rate** = matched records / (all records − excluded records). Declined payments nobody
  booked, and records a person accounted for, are not failures to reconcile.
- **Volumes are per currency**: amounts in different currencies are never added together.
- **The exception CSV streams** in batches, so memory stays flat for any size. A PDF is capped at
  1,000 rows and refuses beyond that instead of silently cutting an audit document short.
- **Safe to open in Excel**: cells that would run as formulas (`=`, `+`, `-`, `@`) are neutralised
  (OWASP CSV injection), and a UTF-8 byte-order mark keeps names intact.
- **Reports leave the system, so they are audited** (`report.export`: who, which report, period,
  filters, row count), sent with `Cache-Control: no-store`, and rate-limited to 30 per minute.

### 5. Sign-in, roles and audit trail

**What you see:** sign in with a work email; the sidebar shows only what your role may do; change
your password from the user menu (every other device is signed out).

**What the code does:**

| Piece          | Design                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Passwords      | Argon2id (OWASP parameters). Unknown emails cost the same time as wrong passwords.                  |
| Access token   | JWT (HS256, 15 min), sent as `Authorization: Bearer`. Algorithm, issuer, audience pinned.           |
| Refresh token  | 256-bit opaque token in an `httpOnly` cookie scoped to `/api/v1/auth`; only its SHA-256 is stored.  |
| Rotation       | Every refresh issues a new token. Replaying an old one revokes the whole session (theft detection). |
| CSRF           | Cookie endpoints require an `x-requested-by: paritas-web` header (blocked cross-site by CORS).      |
| Secure default | Every route requires a valid token unless marked `@Public()`; `@Roles()` restricts by role.         |
| Brute force    | Login limited to 10 attempts per minute per IP; a global rate limit on everything else.             |

Roles: **Admin** (users, sources, matching rules), **Manager** (monitors health, reads the audit
trail), **Officer** (works exceptions). The web app hides what a role cannot do, and the API
enforces it on every request regardless.

Every important action is written to `audit_logs` with the actor, the entity, a
`{ before, after }` diff and the request context (request id, IP, user agent), in the same database
transaction as the change itself, so one never exists without the other.

In the browser, the access token lives only in memory (never `localStorage`); a reload restores it
from the cookie. Concurrent renewals share one request, and tabs take turns through the Web Locks
API. The web server sends security headers on every page (frame blocking, `nosniff`, a strict
referrer policy, a permissions policy, HSTS).

### 6. Design system

The web app follows one visual system; open `/design-system` after signing in to see every token
and component rendered by the real code.

- **Palette:** coolors "Ocean Sunset" (`#001219 #005f73 #0a9396 #94d2bd #e9d8a6 #ee9b00 #ca6702
#bb3e03 #ae2012 #9b2226`), chosen because its run maps onto the product: ink and petrol for the
  shell and actions, mint for matched, and sand → amber → orange → rust → crimson as the severity
  ladder. Light and dark themes; every text pairing meets WCAG 2.2 AA (computed).
- **Type:** Yantramanav throughout. Its digits are all one width, so money columns align; JetBrains
  Mono only for identifiers (`pi_3QgT8a`, `LED-7Q2K9`), where 0/O and 1/l must stay apart.
- **Severity never relies on colour alone:** a four-tick meter plus a row edge and a label.
- **Sign-in page:** three columns on the ink ground: the headline, the product at work, and the
  form. The middle is a collage of real Paritas screens (a match with its score, an exception
  being resolved, a report) that changes every 2.8 seconds, with a pause button, over a slowly
  drifting grain gradient in the palette's teal and amber (WebGL, paused off-screen, a still frame
  under reduced motion). It holds the first set on a phone.
- **Accessibility checked in a real browser:** one `<main>` and labelled navigation per page, no
  skipped heading levels, no unlabelled controls, a skip link, 44px touch targets on touch screens,
  motion off under reduced-motion. Charts are plain SVG with a data table under each.
- **Process:** Taste-Skill set the direction, ui-ux-engineering governed every component (all
  states, labels, keyboard, responsive), and Impeccable audited the result (0 findings on the
  source and on the rendered pages).

### 7. Simulator (demo data)

`POST /api/v1/simulator/runs` (Admin, or "Simulate payments" on the dashboard) plays both the
merchant's checkout and its internal ledger, and injects realistic mistakes so every exception type
can be shown:

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

## Request / Response Flow

The main path: a customer pays, the two records meet, a mistake becomes an exception, and a person
closes it.

**Part 1: a payment arrives (no person involved)**

1. Stripe sends `payment_intent.succeeded` to `POST /api/v1/webhooks/stripe`.
   `StripeWebhookController.receive` (`apps/api/src/modules/ingestion/webhooks/stripe-webhook.controller.ts`)
   verifies the `Stripe-Signature` over the raw request bytes and rejects stale or forged events.
2. `IngestionService.receive` (`modules/ingestion/ingestion.service.ts`) stores the untouched payload
   in `raw_events` (a repeat delivery hits the unique key and is acknowledged as a duplicate),
   enqueues a BullMQ job whose id is the raw event id, and the controller answers `200` straight away.
3. `IngestionProcessor` (`modules/ingestion/ingestion.processor.ts`) picks up the job and calls
   `RawEventHandler.handle` (`raw-event-handler.service.ts`), which runs the Stripe normaliser
   (`modules/ingestion/stripe/stripe.normalizer.ts`) to turn the payload into the common format.
4. `TransactionWriter.apply` (`transaction-writer.service.ts`) upserts the `transactions` row inside a
   database transaction, ignoring events older than what is stored. Then a "match" job is queued.
5. `ReconciliationProcessor` (`modules/reconciliation/reconciliation.processor.ts`) calls
   `MatchingEngine.evaluate` (`modules/reconciliation/engine/matching-engine.service.ts`). Inside one
   database transaction it takes the per-currency advisory lock, loads the matching rules, checks for
   duplicates, then asks the `CandidateFinder` for the counterpart: exact by reference, otherwise
   scored with `rules/scoring.ts`.
6. The pair verdict (`rules/pair-verdict.ts`) decides: write a match (`match-writer.ts`) or open an
   exception with a type and severity (`exception-writer.ts`, `rules/severity.ts`). The transaction's
   status is recalculated (`status-recalculator.ts`) and the lock is released on commit.

**Part 2: a person closes the exception**

7. In the web app, the dashboard and the queue refresh through TanStack Query; the new exception
   appears. The officer opens it at `/exceptions/[id]`, which loads `GET /api/v1/exceptions/:id`
   (records side by side and the timeline).
8. The officer clicks **Resolve** in the decision panel
   (`apps/web/src/features/exceptions/investigation/decision-panel.tsx`) and types a reason. The
   reason dialog (`reason-dialog.tsx`) validates it with the shared Zod schema, then the request goes
   through `apiRequest` (`apps/web/src/lib/api/api-client.ts`), which adds the in-memory access token
   and renews the session once if the token has just expired.
9. `POST /api/v1/exceptions/:id/resolve` reaches `ExceptionActionsController.resolve`
   (`modules/exceptions/exception-actions.controller.ts`). The global guard has already checked the
   JWT and the role; the body was validated with the same schema.
10. `ExceptionTransitionsService.transition` (`exception-transitions.service.ts`), through
    `ExceptionLifecycle.withLockedException`, takes the same per-currency lock as the engine, checks
    the move is allowed by the state machine, updates the
    exception only if its status is still the one it read (otherwise `409 Conflict`), marks unmatched
    records `EXCLUDED`, appends a timeline entry and writes the audit record, all in one transaction.
11. The API returns the updated exception. The web app shows a toast and invalidates the cached
    queue, counts and dashboard, so every screen shows the new state.

## Key Technical Decisions and Trade-offs

| Decision                                                                     | Why                                                                                                          | What was given up                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Store first, process later** (webhook → `raw_events` → queue)              | Webhooks answer in milliseconds; nothing is lost if processing fails; any event can be replayed later.       | More moving parts (Redis, workers, a sweeper) and a few seconds of delay before a payment shows as matched.                   |
| **Money as integer cents** (`BIGINT`)                                        | Floating point cannot represent cents exactly; sums would drift.                                             | Every display and input has to convert using the currency's exponent.                                                         |
| **Per-currency advisory lock** for matching and human actions                | Two workers (or a worker and a person) can never claim the same record at once, on any number of replicas.   | Payments in one currency are evaluated one at a time. Fine at this scale; a busy single-currency shop would need finer locks. |
| **Weighted score with stored breakdown** instead of a machine-learning model | Explainable: an officer sees why the engine paired two records, and an admin can tune the thresholds.        | Weights are fixed by hand, not learned from past decisions.                                                                   |
| **Rules in a database row**, editable by an admin                            | Tolerances change without a deploy, and every change is audited with before/after values.                    | One global rule set; no per-source or per-merchant rules yet.                                                                 |
| **Excluded instead of deleted** when a person closes a one-sided case        | Nothing is lost; the engine can still match it if a real counterpart arrives later.                          | Reports must subtract excluded records, which makes "match rate" need a footnote.                                             |
| **Append-only audit log enforced by a trigger**, no foreign keys             | History cannot be edited even by a bug in the app, and outlives the rows it describes.                       | The table only grows; it would need partitioning or archiving at scale.                                                       |
| **Access token in memory, refresh token in an httpOnly cookie**              | An injected script cannot read either token; a reload still restores the session.                            | Every new tab and every reload makes one refresh call before showing data.                                                    |
| **Shared Zod schemas** between API and web                                   | One definition of "valid" for each request; forms show the same messages the API would.                      | The web bundle includes Zod, and both apps must upgrade it together.                                                          |
| **No script-level Content-Security-Policy** on the web app                   | Next.js and the theme script run inline; a nonce-based CSP would force every page to render on each request. | Weaker protection against injected scripts; the other headers (framing, `nosniff`, referrer, HSTS) are sent.                  |
| **Migrations as a one-off container**, not on API start-up                   | Several API replicas never race to migrate the same database.                                                | A deployment has one extra step to run first (Compose does it automatically).                                                 |

## Challenges and How They Were Solved

1. **Two workers pairing the same record twice.** With several workers running at once, two
   payments could both claim the same ledger entry: "is this entry still free?" and "write the
   match" are two steps, and both workers can pass the check before either writes. The fix was a PostgreSQL transaction-scoped
   advisory lock per currency: every evaluation, and every human action, takes it and re-reads state
   under it. A test of 600 simulated payments in three concurrent runs ended with zero duplicates.
2. **A fuzzy guess beating the real counterpart.** When the ledger entry with the exact reference
   arrived a few seconds late, the engine had already paired the payment with a similar-looking one.
   The fix: a record that carries a reference waits a 2-minute settle window before fuzzy matching,
   so the exact counterpart always wins.
3. **Webhooks arriving out of order.** Stripe does not promise order, so "processing" could arrive
   after "succeeded" and roll a payment backwards. The fix: compare the source's own event time and
   let the newest one win; a refund only changes the status.
4. **Signing out by accident with two tabs open.** The API rotates the refresh cookie on every use
   and treats a reused cookie as theft. Two tabs refreshing at the same moment would sign the user
   out everywhere. The fix: one refresh in flight per tab, and the Web Locks API so tabs take turns
   (the second tab then sends the already rotated cookie).
5. **"Days" in reports.** Counting by UTC put late-evening US payments on the wrong day, and
   daylight-saving days have 23 or 25 hours. The fix: send the viewer's time zone and let PostgreSQL
   turn each calendar day into exact instants with `AT TIME ZONE`.
6. **Next.js 16 build rules.** Pages that swapped their content for a sign-in check, read the URL
   outside a Suspense boundary, or used the current date during the build failed the static
   pre-render checks. The fix: every page always renders its shell, only user-specific parts wait
   for the session, URL readers sit inside Suspense, and "today" and the time zone are read with
   `useSyncExternalStore` (unknown during the build, filled in the browser).
7. **Docker images that were too big.** The API image was 950 MB and the migration image 2.25 GB.
   The cause: pnpm links a package's optional peers whenever the workspace has them, so the Prisma
   CLI, Prisma Studio, an in-memory Postgres and TypeScript ended up in production, and the
   migration image was built from the whole build stage. The fix: a small script
   (`apps/api/docker/prune-deps.mjs`) that cuts those optional-peer links, drops query compilers for
   databases we do not use and removes everything no longer reachable; and a migration image with
   only the Prisma CLI, the schema engine and a compiled seed script. Result: 540 MB and 744 MB, with
   the full stack re-tested (migrations on an empty database, sign-in, PDF and CSV exports).
8. **A deprecation warning from the database driver.** List endpoints ran "rows" and "count" in a
   batch transaction, and Prisma ran related queries at the same time on that one connection, which
   `pg` warns will stop working in its next major version. Under PostgreSQL's default isolation
   that transaction added no consistency, so the two queries now run in parallel on separate
   connections: the warning is gone and the endpoints are slightly faster.

## Future Improvements

- **More sources:** bank statement files (CSV/OFX) and other gateways (PayPal, Adyen), each as a new
  normaliser behind the same pipeline.
- **Currency conversion:** match across currencies using daily exchange rates; today a
  cross-currency pair is reported, not matched.
- **Learn from decisions:** use officers' accepted and rejected suggestions to tune the score
  weights per source.
- **Notifications:** email or Slack alerts for new `CRITICAL` exceptions and a daily digest.
- **Single sign-on** (SAML/OIDC) and password reset by email.
- **A nonce-based Content-Security-Policy** once pages render per request.
- **Scale:** partition `audit_logs` and `raw_events` by month; finer-grained locks than one per
  currency.
- **Observability:** OpenTelemetry traces across webhook → queue → engine, and queue-depth metrics.
- **Automated end-to-end tests in CI** for the main flows (they are verified manually today).

## Getting Started

Prerequisites: Node.js 24+, pnpm 10, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env          # then set JWT_ACCESS_SECRET (see the comment in the file)
cp apps/web/.env.example apps/web/.env.local     # set NEXT_PUBLIC_DEMO_PASSWORD to list demo accounts on sign-in

pnpm infra:up     # PostgreSQL (localhost:5433) + Redis (localhost:6380)
pnpm db:migrate   # apply migrations
pnpm db:seed      # sources, default matching rules, demo users
pnpm dev          # API on :4000, web on :3000
# then sign in as the admin and press "Simulate payments" on the dashboard
```

Or run everything in containers (migrations and seed run automatically):

```bash
pnpm stack:up
```

| Image             | Contents                                                    |
| ----------------- | ----------------------------------------------------------- |
| `paritas-api`     | Compiled API and production dependencies only (non-root)    |
| `paritas-migrate` | Prisma CLI, schema engine, migrations and the compiled seed |
| `paritas-web`     | Next.js standalone server (non-root)                        |

### Demo accounts (local only)

| Role    | Name             | Email                         | Password            |
| ------- | ---------------- | ----------------------------- | ------------------- |
| Admin   | Walter Ostrowski | `admin@paritas.example.com`   | `Paritas-Demo-2026` |
| Manager | Denise Fairbanks | `manager@paritas.example.com` | `Paritas-Demo-2026` |
| Officer | Carmen Ruelas    | `officer@paritas.example.com` | `Paritas-Demo-2026` |

The password comes from `SEED_DEMO_PASSWORD` in `apps/api/.env`.

| URL                                    | What                 |
| -------------------------------------- | -------------------- |
| http://localhost:3000                  | Web app              |
| http://localhost:4000/api/docs         | OpenAPI (Swagger) UI |
| http://localhost:4000/api/health/ready | Readiness probe      |

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

## API at a Glance

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

## Roadmap

- [x] **Phase 0**: Foundation (monorepo, config, logging, health, errors, Docker)
- [x] **Phase 1**: Data model, authentication and roles, audit log
- [x] **Phase 2**: Transaction ingestion (Stripe webhooks, mock internal ledger)
- [x] **Phase 3**: Matching engine (exact, fuzzy, confidence scoring, anomaly detection)
- [x] **Phase 4**: Exception management workflow (queue, investigation, manual match, audit)
- [x] **Phase 5**: Dashboard metrics, reports and export (CSV, PDF), configurable rules
- [x] **Phase 6**: Frontend design system (tokens, components, app shell, sign-in, session handling)
- [x] **Phase 7**: Frontend screens (dashboard, exception queue and investigation, transactions, reports, administration)
- [x] **Phase 8**: Polish (smaller Docker images, change password, error and 404 pages, security headers, docs)

## License

MIT
