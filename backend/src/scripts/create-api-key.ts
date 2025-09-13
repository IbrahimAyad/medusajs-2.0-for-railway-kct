import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function createApiKey({ container }: ExecArgs) {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  
  try {
    // Create a publishable API key for testing
    const apiKey = await apiKeyModule.createApiKeys({
      title: "Store Frontend Key",
      type: "publishable",
      created_by: "script",
    })
    
    console.log("✅ API Key created successfully!")
    console.log("Publishable Key:", apiKey.token)
    console.log("Key ID:", apiKey.id)
    console.log("\nAdd this to your frontend .env:")
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${apiKey.token}`)
    
    return apiKey
  } catch (error) {
    console.error("Error creating API key:", error)
    throw error
  }
}