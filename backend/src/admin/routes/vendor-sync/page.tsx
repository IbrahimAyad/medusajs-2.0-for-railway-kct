import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"

const VendorSyncPage = () => {
  return (
    <Container className="p-8">
      <Heading level="h1">Vendor Product Sync</Heading>
      <div className="mt-4">
        <iframe 
          src="/admin/widgets/shopify-sync"
          className="w-full h-screen border-0"
        />
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Vendor Sync",
  icon: ShoppingBag,
})

export default VendorSyncPage