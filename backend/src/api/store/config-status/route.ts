import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // This endpoint doesn't require authentication
  const config = {
    environment: process.env.NODE_ENV,
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    worker_mode: process.env.MEDUSA_WORKER_MODE || 'shared',
    s3_configured: {
      access_key_present: !!process.env.S3_ACCESS_KEY_ID,
      secret_key_present: !!process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET || 'not set',
      endpoint: process.env.S3_ENDPOINT ? 'configured' : 'not set',
      file_url: process.env.S3_FILE_URL ? 'configured' : 'not set',
      region: process.env.S3_REGION || 'not set',
    },
    redis: {
      configured: !!process.env.REDIS_URL
    }
  }

  res.json({
    status: "ok",
    config
  })
}