# syntax=docker/dockerfile:1

# Portability exit-proof: the app must boot anywhere, not just Vercel.
# Build:   docker build -t buildcostgh .
# Smoke:   node scripts/portability-smoke.mjs  (vanilla Postgres, no Neon)

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Standalone output + skip `prisma migrate deploy` (CI-style direct build).
ENV DOCKER_BUILD=1
RUN npx prisma generate && npx next build --webpack

# One-off migration runner (compose `migrate` service).
FROM base AS migrate
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./
ENTRYPOINT ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
CMD ["node", "server.js"]
