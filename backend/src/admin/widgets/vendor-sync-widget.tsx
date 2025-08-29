import React, { useState, useEffect } from "react"
import { 
  Container,
  Heading,
  Button,
  Badge,
  Text,
  clx
} from "@medusajs/ui"
import { ArrowPath, CheckCircle, XCircle, ExclamationCircle } from "@medusajs/icons"

/**
 * Vendor Sync Widget - Shows on dashboard
 * Simple widget to display sync status and trigger manual sync
 */
const VendorSyncWidget = () => {
  const [stats, setStats] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch("/admin/vendor-curation")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error loading vendor stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/admin/trigger-shopify-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log("Sync triggered:", data)
        
        // Reload stats after sync
        setTimeout(loadStats, 3000)
      }
    } catch (error) {
      console.error("Error triggering sync:", error)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-4">
        <Text>Loading vendor sync status...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Heading level="h3" className="mb-2">Vendor Product Sync</Heading>
          <Text className="text-gray-600 text-sm">
            Manage products from Shopify vendor
          </Text>
        </div>
        <Button 
          variant="secondary" 
          size="small"
          onClick={triggerSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <ArrowPath className="mr-1 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <ArrowPath className="mr-1 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Total Products</span>
            <Badge color="blue" size="small">{stats.total || 0}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Pending Review</span>
            <Badge color="orange" size="small">
              <ExclamationCircle className="h-3 w-3 mr-1" />
              {stats.pending || 0}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Approved</span>
            <Badge color="green" size="small">
              <CheckCircle className="h-3 w-3 mr-1" />
              {stats.approved || 0}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-600">Published</span>
            <Badge color="green" size="small">{stats.published || 0}</Badge>
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t">
        <Text className="text-xs text-gray-500">
          Products sync from suits-inventory.myshopify.com
        </Text>
        <Text className="text-xs text-gray-500">
          Auto-sync: Wednesdays & Saturdays at 2 AM
        </Text>
      </div>
    </Container>
  )
}

export const config = {
  zone: "admin.dashboard.before"
}

export default VendorSyncWidget