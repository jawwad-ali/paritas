# syntax=docker/dockerfile:1.7
# Build context: repository root (see docker-compose.yml).

# ── Base: Node + pnpm ─────────────────────────────────────
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN npm install -g pnpm@10.18.3
WORKDIR /repo

# ── Build: install workspace deps, compile shared + api ───
FROM base AS build
# Prisma's schema engine (used by `migrate`) links against OpenSSL. The runtime
# image does not need it: queries go through the pure-JS `pg` driver adapter.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --filter "@paritas/api..."

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @paritas/api run generate \
    && pnpm --filter "@paritas/api..." run build

# Self-contained production bundle: dist + prod node_modules only.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm deploy --filter @paritas/api --prod --legacy --ignore-scripts /out

# ── Migrator: one-off job that applies database migrations ─
# Runs before the API starts (see docker-compose.yml). Keeping migrations out of
# the API process means N replicas never race to migrate the same database.
FROM build AS migrator
WORKDIR /repo/apps/api
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ── Runtime: minimal, non-root ────────────────────────────
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:4000/api/health/live').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/main.js"]
