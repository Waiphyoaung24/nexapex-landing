# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Debug: verify build output exists
RUN echo "=== Build output ===" && ls -la dist/ && ls -la dist/work/ && echo "=== Done ==="

# Serve stage (nginx for static files)
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx config to avoid conflicts
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 85

# Health check — use lightweight /health endpoint for faster readiness
HEALTHCHECK --interval=10s --timeout=3s --start-period=2s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:85/health || exit 1
