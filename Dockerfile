# Stage 1 — Install all dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2 — Build Next.js (standalone output)
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL placeholder needed by prisma generate at build time
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# Stage 3 — Production runtime (minimal image)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001

# Next.js standalone server + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma: schema for migrate deploy + query engine binary + CLI
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
