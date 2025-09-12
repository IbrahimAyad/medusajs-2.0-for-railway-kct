FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application files
COPY . .

# Build the application (skip waiting for backend)
RUN npm run build:next

# Expose port
EXPOSE 8000

# Start the application
CMD ["npm", "start"]