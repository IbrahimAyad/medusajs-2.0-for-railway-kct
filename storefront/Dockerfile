# Next.js Dockerfile for Railway
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY storefront/package.json storefront/package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy all storefront files including src directory
COPY storefront/ ./

# Debug: List the error-boundary directory to ensure files are copied
RUN ls -la src/components/ || echo "No components directory"
RUN ls -la src/components/error-boundary/ || echo "Error: error-boundary directory not found"
RUN find . -name "checkout-error-boundary.tsx" || echo "checkout-error-boundary.tsx not found anywhere"

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

# Build arguments for required environment variables
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

# Set them as environment variables for the build
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

# Build the application
RUN npm run build:next

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json for scripts
COPY --from=builder /app/package.json ./package.json

# Copy node_modules for medusajs-launch-utils
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 8080
ENV PORT 8080

# Use npm start which will use the launcher
CMD ["npm", "start"]