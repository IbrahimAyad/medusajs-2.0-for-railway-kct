const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Environment variables with defaults
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/medusa';
const REDIS_URL = process.env.REDIS_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'supersecret';
const ADMIN_CORS = process.env.ADMIN_CORS || 'http://localhost:7000,http://localhost:7001';
const AUTH_CORS = process.env.AUTH_CORS || 'http://localhost:7000,http://localhost:7001';
const STORE_CORS = process.env.STORE_CORS || 'http://localhost:8000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:9000';

// MinIO Storage
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT;
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY;
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'medusa-media';

// Meilisearch
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST;
const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY;

// Payment providers
const STRIPE_API_KEY = process.env.STRIPE_API_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Email
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

// Modules array
const modules = [
  {
    resolve: "@medusajs/payment-stripe",
    enabled: !!STRIPE_API_KEY,
    options: {
      api_key: STRIPE_API_KEY,
      webhook_secret: STRIPE_WEBHOOK_SECRET
    }
  },
  {
    resolve: "@medusajs/notification-sendgrid",
    enabled: !!SENDGRID_API_KEY,
    options: {
      api_key: SENDGRID_API_KEY,
      from: SENDGRID_FROM_EMAIL
    }
  }
];

// Add file storage module
if (MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY) {
  modules.push({
    resolve: "@medusajs/file-minio",
    options: {
      endpoint: MINIO_ENDPOINT,
      access_key: MINIO_ACCESS_KEY,
      secret_key: MINIO_SECRET_KEY,
      bucket: MINIO_BUCKET
    }
  });
} else {
  modules.push({
    resolve: "@medusajs/file-local",
    options: {
      backend_url: BACKEND_URL
    }
  });
}

// Add search module
if (MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY) {
  modules.push({
    resolve: "@medusajs/index-meilisearch",
    options: {
      host: MEILISEARCH_HOST,
      api_key: MEILISEARCH_ADMIN_KEY,
      settings: {
        products: {
          indexSettings: {
            searchableAttributes: ["title", "description"],
            displayedAttributes: ["title", "description", "thumbnail", "handle"]
          }
        }
      }
    }
  });
}

// Add cache module
if (REDIS_URL) {
  modules.push({
    resolve: "@medusajs/cache-redis",
    options: {
      redis_url: REDIS_URL,
      ttl: 300
    }
  });
} else {
  modules.push({
    resolve: "@medusajs/cache-inmemory"
  });
}

// Add event bus module
if (REDIS_URL) {
  modules.push({
    resolve: "@medusajs/event-bus-redis",
    options: {
      redis_url: REDIS_URL
    }
  });
} else {
  modules.push({
    resolve: "@medusajs/event-bus-local"
  });
}

module.exports = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: process.env.WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    }
  },
  admin: {
    disable: process.env.SHOULD_DISABLE_ADMIN === "true",
    path: process.env.ADMIN_PATH || "admin",
    outDir: "./build"
  },
  modules: modules
};