import { useState, useEffect } from "react"
import { Button } from "@medusajs/ui"
import { 
  Container, 
  Heading, 
  Text,
  Badge,
  Table,
  Checkbox
} from "@medusajs/ui"

const ShopifySyncWidget = () => {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  // Fetch Shopify products
  const fetchShopifyProducts = async () => {
    try {
      const response = await fetch("/admin/shopify-products")
      const data = await response.json()
      setProducts(data.products || [])
      setLastSync(data.lastSync)
    } catch (error) {
      console.error("Error fetching Shopify products:", error)
    }
  }

  // Trigger manual sync
  const triggerSync = async () => {
    setSyncing(true)
    try {
      await fetch("/admin/shopify-sync", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productIds: selectedProducts.length > 0 ? selectedProducts : undefined 
        })
      })
      await fetchShopifyProducts()
    } catch (error) {
      console.error("Sync error:", error)
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    fetchShopifyProducts()
  }, [])

  return (
    <Container className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">Shopify Vendor Sync</Heading>
          <Text className="text-gray-500">
            Manage products from suits-inventory.myshopify.com
          </Text>
        </div>
        <div className="flex gap-4">
          {lastSync && (
            <Badge variant="success">
              Last sync: {new Date(lastSync).toLocaleString()}
            </Badge>
          )}
          <Button 
            onClick={triggerSync} 
            disabled={syncing}
            variant="primary"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <Checkbox 
                  checked={selectedProducts.length === products.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedProducts(products.map(p => p.id))
                    } else {
                      setSelectedProducts([])
                    }
                  }}
                />
              </Table.HeaderCell>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
              <Table.HeaderCell>Inventory</Table.HeaderCell>
              <Table.HeaderCell>Price</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {products.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProducts([...selectedProducts, product.id])
                      } else {
                        setSelectedProducts(selectedProducts.filter(id => id !== product.id))
                      }
                    }}
                  />
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.image && (
                      <img 
                        src={product.image} 
                        alt={product.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <Text className="font-medium">{product.title}</Text>
                      <Text className="text-sm text-gray-500">{product.vendor}</Text>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{product.sku}</Table.Cell>
                <Table.Cell>
                  <Badge variant={product.inventory > 0 ? "success" : "danger"}>
                    {product.inventory} units
                  </Badge>
                </Table.Cell>
                <Table.Cell>${product.price}</Table.Cell>
                <Table.Cell>
                  <Badge variant={product.synced ? "success" : "warning"}>
                    {product.synced ? "Synced" : "Pending"}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {selectedProducts.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <Text>
            {selectedProducts.length} products selected. 
            Click "Sync Now" to import only selected products.
          </Text>
        </div>
      )}
    </Container>
  )
}

export const config = {
  zone: "product.list.before",
}

export default ShopifySyncWidget