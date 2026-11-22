# syntax=docker/dockerfile:1.7
# Build context: repository root (see docker-compose.yml).
#
# Stages:
#   build          workspace install, compile shared + api + seed, `pnpm deploy`
#   runtime-deps   production node_modules without the Prisma CLI
#   migrate-deps   only what `prisma migrate deploy` and the seed load
#   migrator       one-off job image (target: migrator)
#   runtime        the API server (default target)

# ── Base: Node + pnpm ─────────────────────────────────────
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN npm install -g pnpm@10.18.3
WORKDIR /repo

# ── Build: install workspace deps, compile shared + api ───
FROM base AS build
# `prisma generate` checks the OpenSSL version to pick its schema engine build.
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
    && pnpm --filter "@paritas/api..." run build \
    && pnpm --filter @paritas/api exec tsc -p tsconfig.seed.json

# Self-contained production bundle: dist + prod node_modules only.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm deploy --filter @paritas/api --prod --legacy --ignore-scripts /out

# The schema engine binary `prisma generate` downloaded (deploy copies packages
# from the store, so its copy of @prisma/engines has none).
RUN engine="$(find /repo/node_modules/.pnpm -type f -path '*/@prisma/engines/schema-engine-*' | head -n 1)" \
    && test -n "$engine" \
    && install -D -m 0755 "$engine" /engines/schema-engine

# ── Runtime deps: the server never loads the Prisma CLI ───
FROM build AS runtime-deps
RUN node apps/api/docker/prune-deps.mjs /out/node_modules --runtime

# ── Migrate deps: Prisma CLI + what the seed imports ──────
FROM build AS migrate-deps
WORKDIR /out/node_modules
# The CLI is linked only as @prisma/client's optional peer; expose it at the top.
RUN set -- .pnpm/prisma@*/node_modules/prisma \
    && test "$#" -eq 1 -a -d "$1" \
    && ln -s "$1" prisma \
    && node /repo/apps/api/docker/prune-deps.mjs /out/node_modules \
       --keep prisma,@prisma/client,@prisma/adapter-pg,@node-rs/argon2,dotenv

# ── Migrator: one-off job that applies database migrations ─
# Runs before the API starts (see docker-compose.yml). Keeping migrations out of
# the API process means N replicas never race to migrate the same database.
FROM node:24-slim AS migrator
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    PRISMA_SCHEMA_ENGINE_BINARY=/app/engines/schema-engine \
    CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1
WORKDIR /app
COPY --from=migrate-deps --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /engines ./engines
COPY --from=build --chown=node:node /repo/apps/api/prisma.config.ts ./
COPY --from=build --chown=node:node /repo/apps/api/prisma ./prisma
# Compiled seed (demo data); run it with `node build/seed/prisma/seed.js`.
COPY --from=build --chown=node:node /repo/apps/api/build/seed ./build/seed
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ── Runtime: minimal, non-root ────────────────────────────
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=runtime-deps --chown=node:node /out/package.json ./package.json
COPY --from=runtime-deps --chown=node:node /out/node_modules ./node_modules
COPY --from=runtime-deps --chown=node:node /out/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:4000/api/health/live').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "dist/main.js"]
