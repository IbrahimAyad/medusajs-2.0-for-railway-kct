import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { Container, Heading, Button, Badge, Text, Checkbox, Select, Input } from "@medusajs/ui"

const VendorCurationPage = () => {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("pending")
  
  // Fetch vendor products
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/admin/vendor-products")
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Failed to fetch products:", error)
    }
    setLoading(false)
  }
  
  // Handle product action (approve/reject)
  const handleAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      alert("Please select products first")
      return
    }
    
    try {
      const response = await fetch("/admin/vendor-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedProducts,
          action: action
        })
      })
      
      if (response.ok) {
        alert(`${selectedProducts.length} products ${action}ed`)
        setSelectedProducts([])
        fetchProducts()
      }
    } catch (error) {
      console.error("Failed to update products:", error)
    }
  }
  
  useEffect(() => {
    fetchProducts()
  }, [filter])
  
  return (
    <Container className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">Vendor Product Curation</Heading>
          <Text className="text-gray-500 mt-2">
            Review and approve products from suits-inventory.myshopify.com
          </Text>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={fetchProducts}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="small"
            onClick={() => handleAction("approve")}
            disabled={selectedProducts.length === 0}
          >
            Approve ({selectedProducts.length})
          </Button>
          <Button
            variant="danger"
            size="small"
            onClick={() => handleAction("reject")}
            disabled={selectedProducts.length === 0}
          >
            Reject
          </Button>
        </div>
        <div className="flex gap-2 items-center">
          <Text className="text-sm">Filter:</Text>
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="pending">Pending Review</Select.Item>
              <Select.Item value="approved">Approved</Select.Item>
              <Select.Item value="rejected">Rejected</Select.Item>
              <Select.Item value="all">All Vendor Products</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <Text>Loading vendor products...</Text>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Text>No products to review</Text>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
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
              
              {product.thumbnail && (
                <img 
                  src={product.thumbnail} 
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              
              <div className="flex-1">
                <Text className="font-medium">{product.title}</Text>
                <div className="flex gap-4 mt-1">
                  <Text className="text-sm text-gray-500">
                    SKU: {product.vendor_sku}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Stock: {product.inventory}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Vendor Price: ${(product.vendor_price / 100).toFixed(2)}
                  </Text>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge 
                  color={
                    product.curation_status === "approved" ? "green" :
                    product.curation_status === "rejected" ? "red" :
                    "orange"
                  }
                >
                  {product.curation_status}
                </Badge>
                {product.status === "published" && (
                  <Badge color="blue">Live</Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Quick Stats */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <Text className="font-medium mb-2">Curation Stats</Text>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Text className="text-sm text-gray-600">Pending Review</Text>
            <Text className="text-2xl font-bold">
              {products.filter(p => p.curation_status === "pending").length}
            </Text>
          </div>
          <div>
            <Text className="text-sm text-gray-600">Approved</Text>
            <Text className="text-2xl font-bold text-green-600">
              {products.filter(p => p.curation_status === "approved").length}
            </Text>
          </div>
          <div>
            <Text className="text-sm text-gray-600">Total from Vendor</Text>
            <Text className="text-2xl font-bold">800+</Text>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Vendor Curation",
  icon: "BuildingStorefront",
})

export default VendorCurationPage