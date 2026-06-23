# Build locally first: npm install && npm run build
# Then docker build

FROM node:22-slim
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy pre-built artifacts
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY node_modules ./node_modules
COPY prisma ./prisma
COPY package.json ./

# Create nextjs user
RUN useradd -m -u 1001 nextjs

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
