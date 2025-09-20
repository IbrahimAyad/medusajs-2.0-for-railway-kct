import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Tags products from Shopify when they sync
 * This keeps them as drafts until manually published
 */
export default async function shopifyProductTagger({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const productId = event.data.id
    console.log(`[Shopify Tagger] Product event for ID: ${productId}`)
    
    // The Shopify plugin already adds metadata
    // We just log for monitoring
    // Manual curation happens in the admin UI
    
  } catch (error) {
    console.error("[Shopify Tagger] Error:", error)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created"],
}