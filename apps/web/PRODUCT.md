# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Reconciliation / finance officer** (primary): works the exception queue every day. Sees what
  did not match, investigates the two records side by side, adds notes, matches records manually,
  resolves or ignores with a reason, and exports reports.
- **Operations manager**: watches reconciliation health (match rate, open and critical exceptions,
  trends), assigns work, changes severity, and approves risky decisions (ignoring a critical
  exception).
- **System administrator**: manages users and roles, enables or disables payment sources, and
  tunes the matching rules.

Target market: finance and payment-operations teams at US companies that take payments through a
gateway (Stripe) and keep their own internal ledger.

## Product Purpose

Paritas continuously receives transactions from a payment gateway (Stripe, test mode) and from the
company's internal ledger, matches them automatically, flags every discrepancy as a manageable
exception in near real time, and produces audit-ready reports. Success: officers spend their time
only on genuine discrepancies, month-end close is no longer a scramble, and every decision can be
explained to an auditor.

## Positioning

Every automated decision is explainable and every human decision is on the record: exact matches
by shared reference, fuzzy matches with a stored per-signal score (amount, customer, time), a
self-healing engine that closes exceptions when records come to agree, and an append-only audit
trail. It is a portfolio-grade MVP built to production standards, to be walked through in
interviews.

## Operating Context

- Desktop-first: long working sessions on a large screen in an office, scanning dense tables and
  working through a queue, often by keyboard. Tablet and phone must work for reading and light
  actions, not as the primary surface.
- Workflow: dashboard (health at a glance) → exception queue (filter, search, sort by priority) →
  investigation (records side by side, timeline, notes) → decision (manual match, resolve, ignore,
  reopen) → reports (CSV / PDF for a date range) for audit and internal review.
- Days are counted in the team's own time zone (e.g. America/New_York).
- The internal tool sits behind sign-in; there is no public marketing site.

## Capabilities and Constraints

- Backend is complete (NestJS API at `/api/v1`, OpenAPI at `/api/docs`); the web app is a client
  of it. Shared contracts live in `@paritas/shared` (zod schemas, DTOs, enums, `formatMoney`).
- Roles: Admin, Manager, Officer. Officers take or release their own exceptions; managers and
  admins assign anyone, change severity, and ignore critical exceptions; only admins change
  matching rules, users and sources.
- Exception types: Missing, Amount mismatch, Duplicate, Status conflict, Delayed, Needs review
  (low-confidence match), Other. Severities: Low, Medium, High, Critical. Statuses: Open,
  Investigating, Resolved, Ignored. Record statuses: Unmatched, Matched, Exception, Excluded.
- Money is integer minor units with a currency; amounts in different currencies are never summed.
- Auth: short-lived access token in memory, refresh token in an httpOnly cookie, CSRF header on
  refresh and logout.
- Test/sandbox payment credentials only. Demo data comes from a built-in simulator.
- Stack: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, lucide-react.

## Brand Commitments

- Name: **Paritas** (Latin for parity, equality: the two sides agree).
- Voice: plain, precise US English for finance professionals; no hype, no jokes in error states.

## Evidence on Hand

- Simulated demo data only (synthetic Stripe-shaped events and ledger entries) and three demo
  accounts. No real customers, logos, testimonials, metrics or case studies exist; none may be
  invented.

## Product Principles

1. **Explain every number.** A match shows its method and score breakdown; a metric states how it
   is computed (e.g. match rate excludes excluded records).
2. **The queue is the product.** The officer's next exception, its evidence and its decision are
   always one step away.
3. **Decisions are deliberate and recorded.** Closing, ignoring and matching ask for a reason;
   nothing irreversible happens silently.
4. **Severity drives attention, not decoration.** Urgency is communicated consistently and never
   by colour alone.
5. **Dense but calm.** Finance users read a lot of figures; density comes with rhythm, alignment and
   tabular numerals, not clutter.

## Accessibility & Inclusion

WCAG 2.2 AA (US enterprise and public-sector buyers expect ADA / Section 508 conformance): text and
UI contrast, full keyboard operation with visible focus, screen-reader labels and live regions for
async results, meaning never by colour alone, reduced-motion respected.
