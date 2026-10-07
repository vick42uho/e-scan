# ==========================================
# Yanhee e-Scan System (DMS) - Frontend Dockerfile
# Next.js 16 Multi-Stage Production Build
# ==========================================

# ------------------------------------------
# Stage 1: Dependencies installation
# ------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies cleanly
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# ------------------------------------------
# Stage 2: Build application
# ------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

# Build Next.js with standalone output
RUN npm run build

# ------------------------------------------
# Stage 3: Production Runner
# ------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Security: run as non-root user and install curl for health checks
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
