import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Check environment variables
  const config = {
    environment: process.env.NODE_ENV,
    railway: !!process.env.RAILWAY_ENVIRONMENT,
    s3_configured: {
      access_key_id: !!process.env.S3_ACCESS_KEY_ID,
      secret_access_key: !!process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      file_url: process.env.S3_FILE_URL,
      region: process.env.S3_REGION,
    },
    file_provider: {
      // This will show which file provider is actually loaded
      module_loaded: req.scope.resolve("file.module") ? "file module loaded" : "no file module",
    }
  }

  res.json({
    message: "Configuration check",
    config
  })
}