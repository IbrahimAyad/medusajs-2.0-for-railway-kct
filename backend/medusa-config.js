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

// Dynamic Stripe configuration function

loadEnv(process.env.NODE_ENV, process.cwd());

// Ensure environment variables are loaded for Railway production
if (process.env.NODE_ENV === 'production') {
  console.log('=== PRODUCTION ENVIRONMENT LOADING ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Railway Domain:', process.env.RAILWAY_PUBLIC_DOMAIN_VALUE);
  console.log('Environment variables available at config time:');
  Object.keys(process.env).filter(k => k.includes('STRIPE')).forEach(key => {
    console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
  });
}


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
      // CRITICAL: Preserve raw body for Stripe webhook signature verification
      preserveRawBody: true,
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
    // Add cache module - use Redis if available, otherwise in-memory
    ...(REDIS_URL && REDIS_URL !== 'redis://' && REDIS_URL.includes('://') && REDIS_URL.length > 10 ? [{
      key: Modules.CACHE,
      resolve: '@medusajs/cache-redis',
      options: {
        redisUrl: REDIS_URL,
        ttl: 300, // 5 minutes TTL for cached data (increased for better performance)
      }
    }] : [{
      key: Modules.CACHE,
      resolve: '@medusajs/cache-inmemory',
      options: {
        ttl: 300 // 5 minutes TTL for in-memory cache (increased for better performance)
      }
    }]),
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
    // ALWAYS load Stripe payment module - CRITICAL for production
    {
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',  // Standard Stripe provider ID
            options: {
              apiKey: process.env.STRIPE_API_KEY || STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET,
              capture: true,  // Use automatic capture for Medusa 2.0 standard flow
              payment_description: 'Order from KCT Menswear',
              automatic_payment_methods: true,
            },
          },
        ],
      },
    },
    // ALWAYS load Stripe Tax module
    {
      key: Modules.TAX,
      resolve: '@medusajs/tax',
      options: {
        providers: [
          {
            resolve: './src/modules/stripe-tax',
            id: 'stripe-tax',
            options: {
              api_key: process.env.STRIPE_API_KEY || STRIPE_API_KEY,
              automatic_tax: true,
            },
          },
        ],
      },
    }
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
