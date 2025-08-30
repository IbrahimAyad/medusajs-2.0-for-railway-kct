import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { importProductsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import path from "path"

/**
 * Official Medusa Product Import - Following v2.8.5+ documentation
 * This uses the official importProductsWorkflow as documented
 */

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { csvPath } = (req.body as any) || {}
    
    // Default to the official template if no path provided
    const filePath = csvPath || path.join(process.cwd(), "medusa-official-template.csv")
    
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, "utf-8")
    const filename = path.basename(filePath)
    
    console.log("Starting official import workflow...")
    
    // Use the official importProductsWorkflow
    const { result, transaction } = await importProductsWorkflow(req.scope)
      .run({
        input: {
          fileContent,
          filename
        }
      })
    
    // The workflow needs to be confirmed
    const transactionId = transaction?.transactionId
    
    if (transactionId) {
      console.log(`Import started with transaction ID: ${transactionId}`)
      
      // Auto-confirm the import
      // Note: In production, you might want to review before confirming
      try {
        const workflowEngine = req.scope.resolve("workflowEngine") as any
        await workflowEngine.confirm(transactionId)
        
        res.json({
          success: true,
          message: "Import workflow started and confirmed",
          transactionId,
          result
        })
      } catch (confirmError) {
        console.error("Failed to confirm import:", confirmError)
        res.json({
          success: true,
          message: "Import workflow started - manual confirmation required",
          transactionId,
          result,
          note: "Go to admin panel to confirm import"
        })
      }
    } else {
      throw new Error("No transaction ID returned from workflow")
    }
    
  } catch (error) {
    console.error("Official import error:", error)
    res.status(500).json({
      error: "Official import failed",
      message: error.message,
      suggestion: "Ensure CSV matches official template format"
    })
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Official Medusa Import Endpoint",
    usage: "POST with optional csvPath in body",
    template: "medusa-official-template.csv in backend folder",
    docs: "https://docs.medusajs.com/modules/products/admin/import-products"
  })
}