import { loadEnv, Modules, defineConfig } from '@medusajs/framework/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  S3_FILE_URL,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_REGION,
  S3_BUCKET,
  S3_ENDPOINT,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  EASYPOST_API_KEY,
  SHOPIFY_DOMAIN,
  SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_LOCATION_ID
} from './src/lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

// Check if S3 vars are available from constants
console.log('=== Environment Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('From ENV - S3_ACCESS_KEY_ID:', !!process.env.S3_ACCESS_KEY_ID);
console.log('From ENV - S3_SECRET_ACCESS_KEY:', !!process.env.S3_SECRET_ACCESS_KEY);
console.log('From ENV - S3_BUCKET:', process.env.S3_BUCKET);
console.log('From constants - S3_ACCESS_KEY_ID:', !!S3_ACCESS_KEY_ID);
console.log('From constants - S3_SECRET_ACCESS_KEY:', !!S3_SECRET_ACCESS_KEY);
console.log('From constants - S3_BUCKET:', S3_BUCKET);
console.log('From constants - S3_ENDPOINT:', S3_ENDPOINT);
console.log('Will use S3:', !!(S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET));
console.log('=========================');

// Debug Stripe configuration
console.log('=== Stripe Configuration ===');
console.log('STRIPE_API_KEY exists:', !!STRIPE_API_KEY);
console.log('STRIPE_API_KEY length:', STRIPE_API_KEY ? STRIPE_API_KEY.length : 0);
console.log('STRIPE_API_KEY prefix:', STRIPE_API_KEY ? STRIPE_API_KEY.substring(0, 12) + '...' : 'NOT SET');
console.log('STRIPE_WEBHOOK_SECRET exists:', !!STRIPE_WEBHOOK_SECRET);
console.log('============================');

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
      // Add CSP headers for Cloudflare Stream videos
      additionalHeaders: {
        "Content-Security-Policy": "default-src 'self' https:; frame-src 'self' https://customer-6njalxhlz5ulnoaq.cloudflarestream.com; media-src 'self' https://customer-6njalxhlz5ulnoaq.cloudflarestream.com blob:; img-src 'self' data: https: blob:; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://customer-6njalxhlz5ulnoaq.cloudflarestream.com",
        "X-Frame-Options": "SAMEORIGIN",
        "X-Content-Type-Options": "nosniff"
      }
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          // Use R2/S3 if configured, otherwise MinIO, otherwise local
          ...(S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET ? [{
            resolve: '@medusajs/file-s3',
            id: 's3',
            options: {
              file_url: S3_FILE_URL || `${BACKEND_URL}/static`,
              access_key_id: S3_ACCESS_KEY_ID,
              secret_access_key: S3_SECRET_ACCESS_KEY,
              region: S3_REGION || 'auto',
              bucket: S3_BUCKET,
              endpoint: S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true // Required for R2
              }
            }
          }] : MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET // Optional, default: medusa-media
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
        ]
      }
    }] : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }] : [])
  ],
  plugins: [
    ...(SHOPIFY_DOMAIN && SHOPIFY_ACCESS_TOKEN ? [{
      resolve: 'medusa-source-shopify',
      options: {
        domain: SHOPIFY_DOMAIN,
        password: SHOPIFY_ACCESS_TOKEN,
        location_id: SHOPIFY_LOCATION_ID,
        // Optional: specify which data to sync
        sync_options: {
          products: true,
          collections: true,
          // Run sync every Wednesday and Saturday at 2 AM
          schedule: '0 2 * * 3,6'
        }
      }
    }] : []),
  ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY
        },
        settings: {
          products: {
            type: 'products',
            enabled: true,
            fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
            indexSettings: {
              searchableAttributes: ['title', 'description', 'variant_sku'],
              displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
              filterableAttributes: ['id', 'handle'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : [])
  ]
};

export default defineConfig(medusaConfig);
