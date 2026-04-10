FROM node:22-alpine AS base

# ── Install dependencies only when needed ──
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Build the application ──
FROM base AS builder
WORKDIR /app

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Production image — lightweight standalone ──
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3011
ENV PORT=3011
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
