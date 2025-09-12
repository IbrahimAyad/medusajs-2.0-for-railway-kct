FROM node:20-alpine

WORKDIR /app

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