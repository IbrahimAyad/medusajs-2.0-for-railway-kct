FROM node:20-alpine

# Cache bust: 2025-09-12-19:45
WORKDIR /app

# Skip backend check during build
ENV SKIP_BACKEND_CHECK=true

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