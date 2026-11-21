# Paritas

**Automated transaction reconciliation and data integrity engine.**

Companies that take payments through gateways like Stripe keep two copies of every
transaction: the gateway's record and their own. Those copies drift apart: missing
entries, fee-adjusted amounts, duplicates, conflicting statuses. Finance teams usually
find out at month-end and reconcile by hand. Paritas ingests transactions from every
source as they happen, matches them automatically, turns every discrepancy into a
trackable exception, and produces audit-ready reports.

> Status: **Phase 0 (Foundation)** complete. See the [roadmap](#roadmap).

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

| Path              | What it is                                                    |
| ----------------- | ------------------------------------------------------------- |
| `apps/api`        | NestJS 12 API (ESM). Config, logging, health, error contract. |
| `apps/web`        | Next.js 16 App Router frontend (Tailwind CSS).                |
| `packages/shared` | Contracts shared by API and web (API constants, error shape). |

### Foundation decisions

- **Fail-fast config**: every environment variable is validated with Zod at boot
  (`apps/api/src/config/env.schema.ts`). A bad deploy fails to start instead of misbehaving.
- **One error shape**: every non-2xx response is RFC 9457 `application/problem+json`
  with a `requestId`. Unknown errors never leak internals.
- **Traceable requests**: each request gets an `x-request-id` (or reuses the caller's),
  attached to every structured (pino) log line and returned in the response.
- **Kubernetes-style probes**: `/api/health/live` (process is up) and
  `/api/health/ready` (PostgreSQL + Redis reachable), wired into Docker `HEALTHCHECK`s.
- **Secure defaults**: Helmet headers, CORS allow-list, global rate limiting,
  non-root containers, secrets only via environment.
- **Versioned API**: routes live under `/api/v1/...`.

## Getting started

Prerequisites: Node.js 24+, pnpm 10, Docker.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

pnpm infra:up     # PostgreSQL (localhost:5433) + Redis (localhost:6380)
pnpm dev          # API on :4000, web on :3000
```

Or run everything in containers:

```bash
pnpm stack:up
```

| URL                                    | What                 |
| -------------------------------------- | -------------------- |
| http://localhost:3000                  | Web app              |
| http://localhost:4000/api/docs         | OpenAPI (Swagger) UI |
| http://localhost:4000/api/health/ready | Readiness probe      |

### Useful scripts

| Command          | Does                                     |
| ---------------- | ---------------------------------------- |
| `pnpm dev`       | Run all apps in watch mode (Turborepo)   |
| `pnpm build`     | Build every package                      |
| `pnpm lint`      | Lint every package                       |
| `pnpm typecheck` | Type-check every package                 |
| `pnpm infra:up`  | Start PostgreSQL + Redis                 |
| `pnpm stack:up`  | Build and start the full stack in Docker |

## Roadmap

- [x] **Phase 0**: Foundation (monorepo, config, logging, health, errors, Docker)
- [ ] **Phase 1**: Data model, authentication and roles, audit log
- [ ] **Phase 2**: Transaction ingestion (Stripe webhooks, mock internal ledger)
- [ ] **Phase 3**: Matching engine (exact, fuzzy, confidence scoring, anomaly detection)
- [ ] **Phase 4**: Exception management workflow
- [ ] **Phase 5**: Dashboard metrics, reports and export, configurable rules
- [ ] **Phase 6**: Frontend design system
- [ ] **Phase 7**: Frontend screens

## License

MIT
