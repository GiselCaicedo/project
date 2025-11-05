## Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
# Provide safe defaults for required public envs at build time
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dummy_publishable_key
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
# Reduce noise/size in CI-style builds
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

## Runtime stage
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
# Copy only the standalone server build and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# Next.js standalone outputs a server.js entrypoint at project root
CMD ["node", "server.js"]
