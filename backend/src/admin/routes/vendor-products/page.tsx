import { useState, useEffect } from "react"
import { 
  Container, 
  Heading, 
  Button,
  Table,
  Badge,
  DropdownMenu,
  Input,
  Select,
  useToast,
  CommandBar,
  FocusModal
} from "@medusajs/ui"
import { 
  ArrowDownTray, 
  ArrowPath,
  CheckCircle,
  XCircle,
  ExclamationCircle
} from "@medusajs/icons"

const VendorProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    loadProducts()
    loadStats()
  }, [filterStatus])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") {
        params.append("status", filterStatus)
      }
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/admin/vendor-products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "error"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/admin/vendor-products/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const triggerSync = async () => {
    try {
      toast({
        title: "Sync started",
        description: "Fetching products from Shopify...",
        variant: "info"
      })

      const response = await fetch("/admin/vendor-products/sync", {
        method: "POST"
      })
      const data = await response.json()

      toast({
        title: "Sync completed",
        description: `Added: ${data.added}, Updated: ${data.updated}`,
        variant: "success"
      })

      loadProducts()
      loadStats()
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "error"
      })
    }
  }

  const handleImport = async (productId) => {
    setSelectedProduct(products.find(p => p.id === productId))
    setImportModalOpen(true)
  }

  const confirmImport = async () => {
    try {
      const response = await fetch(`/admin/vendor-products/${selectedProduct.id}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          price: selectedProduct.our_price || selectedProduct.vendor_price
        })
      })

      if (response.ok) {
        toast({
          title: "Product imported",
          description: `${selectedProduct.title} has been added to your store`,
          variant: "success"
        })
        setImportModalOpen(false)
        loadProducts()
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "error"
      })
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: "grey", icon: ExclamationCircle, label: "Not Imported" },
      imported: { color: "green", icon: CheckCircle, label: "Imported" },
      updated: { color: "orange", icon: ArrowPath, label: "Needs Update" },
      rejected: { color: "red", icon: XCircle, label: "Rejected" }
    }

    const variant = variants[status] || variants.pending
    const Icon = variant.icon

    return (
      <Badge color={variant.color} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    )
  }

  return (
    <Container>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading level="h1">Vendor Products</Heading>
          {stats && (
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>Total: {stats.total}</span>
              <span>Imported: {stats.imported}</span>
              <span>Pending: {stats.pending}</span>
              {stats.last_sync && (
                <span>Last Sync: {new Date(stats.last_sync.completed_at).toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
        <Button onClick={triggerSync} variant="primary">
          <ArrowPath className="mr-2 h-4 w-4" />
          Sync from Shopify
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && loadProducts()}
          className="max-w-sm"
        />
        <Select
          value={filterStatus}
          onValueChange={setFilterStatus}
        >
          <Select.Trigger className="w-40">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Products</Select.Item>
            <Select.Item value="pending">Not Imported</Select.Item>
            <Select.Item value="imported">Imported</Select.Item>
            <Select.Item value="updated">Needs Update</Select.Item>
            <Select.Item value="rejected">Rejected</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell>SKU</Table.HeaderCell>
            <Table.HeaderCell>Vendor Price</Table.HeaderCell>
            <Table.HeaderCell>Variants</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center py-8">
                Loading products...
              </Table.Cell>
            </Table.Row>
          ) : products.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6} className="text-center py-8">
                No products found. Click "Sync from Shopify" to fetch products.
              </Table.Cell>
            </Table.Row>
          ) : (
            products.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-gray-500">{product.vendor}</div>
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{product.shopify_handle || '-'}</Table.Cell>
                <Table.Cell>${product.vendor_price}</Table.Cell>
                <Table.Cell>{product.variants?.length || 0} variants</Table.Cell>
                <Table.Cell>{getStatusBadge(product.status)}</Table.Cell>
                <Table.Cell>
                  <DropdownMenu>
                    <DropdownMenu.Trigger asChild>
                      <Button variant="ghost" size="small">
                        Actions
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      {product.status === 'pending' && (
                        <DropdownMenu.Item onClick={() => handleImport(product.id)}>
                          <ArrowDownTray className="mr-2 h-4 w-4" />
                          Import to Store
                        </DropdownMenu.Item>
                      )}
                      {product.status === 'imported' && (
                        <DropdownMenu.Item>
                          Update Product
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item>
                        View Details
                      </DropdownMenu.Item>
                      {product.status !== 'rejected' && (
                        <DropdownMenu.Item className="text-red-600">
                          Reject Product
                        </DropdownMenu.Item>
                      )}
                    </DropdownMenu.Content>
                  </DropdownMenu>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>

      {/* Import Modal */}
      <FocusModal open={importModalOpen} onOpenChange={setImportModalOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <h2>Import Product to Store</h2>
          </FocusModal.Header>
          <FocusModal.Body>
            {selectedProduct && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedProduct.title}</h3>
                  <p className="text-sm text-gray-500">SKU: {selectedProduct.shopify_handle}</p>
                </div>
                
                {selectedProduct.images?.[0] && (
                  <img 
                    src={selectedProduct.images[0]} 
                    alt={selectedProduct.title}
                    className="w-full h-48 object-cover rounded"
                  />
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Your Price (Vendor Price: ${selectedProduct.vendor_price})
                  </label>
                  <Input
                    type="number"
                    defaultValue={selectedProduct.vendor_price}
                    onChange={(e) => selectedProduct.our_price = parseFloat(e.target.value)}
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    This will create a new product in your store with {selectedProduct.variants?.length || 0} variants.
                    Inventory will be synced automatically.
                  </p>
                </div>
              </div>
            )}
          </FocusModal.Body>
          <FocusModal.Footer>
            <Button variant="secondary" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmImport}>
              Import to Store
            </Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export default VendorProductsPage