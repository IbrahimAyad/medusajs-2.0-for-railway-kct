import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

/**
 * Automatically tags products from Shopify with curation metadata
 * This runs whenever a product is created or updated
 */
export default async function shopifyProductTagger({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const productService = container.resolve("product")
    const productId = event.data.id
    
    // Get the product that was just created/updated
    const product = await productService.retrieve(productId, {
      relations: ["variants", "tags"]
    })
    
    // Check if this is a Shopify product
    if (product.metadata?.source === "shopify" && !product.metadata?.curation_status) {
      // Tag new Shopify products for curation
      await productService.update(productId, {
        status: "draft", // Keep as draft until reviewed
        metadata: {
          ...product.metadata,
          source: "shopify",
          curation_status: "pending",
          import_date: new Date().toISOString(),
          vendor_sku: product.metadata?.vendor_sku || product.variants?.[0]?.sku,
          vendor_price: product.metadata?.vendor_price || product.variants?.[0]?.prices?.[0]?.amount,
          needs_review: true
        }
      })
      
      console.log(`[Shopify Tagger] Tagged product ${product.title} for curation review`)
    }
  } catch (error) {
    console.error("[Shopify Tagger] Error tagging product:", error)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}