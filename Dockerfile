FROM node:20-alpine

# Cache bust: 2025-09-12-19:45
WORKDIR /app

# Skip backend check during build
ENV SKIP_BACKEND_CHECK=true

# Set build-time environment variables
ENV NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://backend-production-7441.up.railway.app
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81
ENV NEXT_PUBLIC_BASE_URL=https://storefront-production-c1c6.up.railway.app
ENV NEXT_PUBLIC_DEFAULT_REGION=us
ENV NEXT_PUBLIC_STRIPE_KEY=pk_live_51RAbDsLJdqvxckOOHoXH0nzWxNQl6HiVKoQANnRhFwPGhk0LxD5tVmgozCu3pM8AczCFfN0LuCO8t6jRPYdEEFHl009z1VSkD9

# Copy storefront package files
COPY storefront/package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy storefront application files
COPY storefront/ .

# Build the application (skip waiting for backend)
RUN npm run build:next

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]