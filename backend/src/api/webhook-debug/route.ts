import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Debug endpoint to understand Railway's request handling
 * Endpoint: /webhook-debug
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    bodyType: typeof req.body,
    bodyValue: req.body,
    bodyIsUndefined: req.body === undefined,
    bodyIsNull: req.body === null,
    hasRawBody: !!(req as any).rawBody,
    rawBodyType: typeof (req as any).rawBody,
    readable: req.readable,
    readableEnded: (req as any).readableEnded,
    complete: (req as any).complete,
    bodyUsed: (req as any).bodyUsed,
    // Try to read if readable
    canRead: req.readable && !((req as any).readableEnded)
  }

  console.log("[Debug Webhook] Request debug info:", JSON.stringify(debugInfo, null, 2))

  // If body is missing and request is readable, try to read it
  if (req.body === undefined && req.readable) {
    console.log("[Debug Webhook] Attempting to read body stream...")

    const chunks: Buffer[] = []
    let bodyRead = false

    req.on('data', (chunk) => {
      chunks.push(chunk)
      console.log(`[Debug Webhook] Received chunk: ${chunk.length} bytes`)
    })

    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8')
      console.log(`[Debug Webhook] Stream ended. Total body: ${rawBody.length} bytes`)
      console.log(`[Debug Webhook] Body content: ${rawBody.substring(0, 500)}`)
      bodyRead = true
    })

    // Wait a bit for body to be read
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (bodyRead) {
      debugInfo.bodyValue = "Body was read from stream"
    }
  }

  res.json({
    success: true,
    debug: debugInfo,
    message: "Debug information collected"
  })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "ok",
    message: "Webhook debug endpoint is working",
    timestamp: new Date().toISOString()
  })
}