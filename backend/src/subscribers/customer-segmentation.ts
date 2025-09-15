/**
 * Automated Customer Segmentation
 * Handles guest conversion tracking and lifecycle management
 */

import { Modules } from '@medusajs/framework/utils'
import { 
  ICustomerModuleService, 
  IOrderModuleService,
  INotificationModuleService 
} from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

/**
 * Guest Purchase Tracking
 * Automatically adds guest purchasers to the Guest Purchasers group
 */
export async function handleGuestPurchase({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  
  try {
    const order = await orderModuleService.retrieveOrder(data.id)
    
    // Check if this is a guest checkout (no customer_id)
    if (!order.customer_id) {
      console.log(`🛍️ Guest checkout detected for order ${order.id}`)
      
      // Find or create the Guest Purchasers group
      const [groups] = await customerModuleService.listAndCountCustomerGroups({
        name: "Guest Purchasers"
      })
      
      if (groups.length > 0) {
        const guestGroup = groups[0]
        
        // Store guest info for conversion tracking
        const guestData = {
          email: order.email,
          order_id: order.id,
          order_total: order.total,
          order_date: order.created_at,
          conversion_status: "pending",
          conversion_incentive_sent: false
        }
        
        // Update group metadata with guest tracking
        const currentMetadata = guestGroup.metadata || {}
        const guestTracking: any[] = (currentMetadata.guest_tracking as any[]) || []
        guestTracking.push(guestData)
        
        await customerModuleService.updateCustomerGroups(guestGroup.id, {
          metadata: {
            ...currentMetadata,
            guest_tracking: guestTracking,
            total_guest_purchases: guestTracking.length,
            last_updated: new Date().toISOString()
          }
        })
        
        // Schedule post-purchase conversion email (24 hours later)
        setTimeout(async () => {
          await sendConversionEmail(order.email, order.id, container)
        }, 24 * 60 * 60 * 1000) // 24 hours
        
        console.log(`✅ Guest purchase tracked for ${order.email}`)
      }
    }
  } catch (error) {
    console.error('Error handling guest purchase:', error)
  }
}

/**
 * New Customer Registration
 * Handles when a customer creates an account
 */
export async function handleCustomerRegistration({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  try {
    const customer = await customerModuleService.retrieveCustomer(data.id)
    console.log(`👤 New customer registered: ${customer.email}`)
    
    // Find the New Customer group
    const [groups] = await customerModuleService.listAndCountCustomerGroups({
      name: "New Customer"
    })
    
    if (groups.length > 0) {
      const newCustomerGroup = groups[0]
      
      // Add customer to New Customer group
      await customerModuleService.addCustomerToGroup({
        customer_id: customer.id,
        customer_group_id: newCustomerGroup.id
      })
      
      // Check if this was a guest conversion
      const [guestGroups] = await customerModuleService.listAndCountCustomerGroups({
        name: "Guest Purchasers"
      })
      
      if (guestGroups.length > 0) {
        const guestGroup = guestGroups[0]
        const guestTracking: any[] = (guestGroup.metadata?.guest_tracking as any[]) || []
        
        const guestRecord = guestTracking.find(g => g.email === customer.email)
        if (guestRecord) {
          // Mark as converted
          guestRecord.conversion_status = "converted"
          guestRecord.conversion_date = new Date().toISOString()
          guestRecord.customer_id = customer.id
          
          // Update tracking
          await customerModuleService.updateCustomerGroups(guestGroup.id, {
            metadata: {
              ...guestGroup.metadata,
              guest_tracking: guestTracking,
              conversions_count: Number(guestGroup.metadata?.conversions_count || 0) + 1,
              conversion_rate: calculateConversionRate(guestTracking)
            }
          })
          
          console.log(`🎉 Guest converted to customer: ${customer.email}`)
        }
      }
      
      console.log(`✅ Customer added to New Customer segment`)
    }
  } catch (error) {
    console.error('Error handling customer registration:', error)
  }
}

/**
 * Customer Lifecycle Management
 * Automatically moves customers through lifecycle stages
 */
export async function handleCustomerPurchase({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  try {
    const order = await orderModuleService.retrieveOrder(data.id)
    
    if (order.customer_id) {
      const customer = await customerModuleService.retrieveCustomer(order.customer_id)
      
      // Get customer's order history
      const [orders] = await orderModuleService.listAndCountOrders({
        customer_id: customer.id
      })
      
      const purchaseCount = orders.length
      const totalSpend = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
      
      // Determine appropriate segment
      let targetGroup = null
      
      if (totalSpend >= 2000 || purchaseCount >= 5) {
        targetGroup = "VIP Customer"
      } else if (purchaseCount >= 2) {
        targetGroup = "Active Customer"
      }
      
      if (targetGroup) {
        const [groups] = await customerModuleService.listAndCountCustomerGroups({
          name: targetGroup
        })
        
        if (groups.length > 0) {
          // Add to new segment
          await customerModuleService.addCustomerToGroup({
            customer_id: customer.id,
            customer_group_id: groups[0].id
          })
          
          console.log(`⬆️ Customer ${customer.email} upgraded to ${targetGroup}`)
        }
      }
      
      // Check for specialty segments
      await checkSpecialtySegments(order, customer, container)
    }
  } catch (error) {
    console.error('Error handling customer purchase:', error)
  }
}

/**
 * Check for specialty segment qualifications
 */
async function checkSpecialtySegments(order: any, customer: any, container: any) {
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  // Check for Big & Tall purchases
  const bigTallSizes = ["3XL", "4XL", "5XL", "48", "50", "52", "54"]
  const hasBigTallItem = order.items?.some(item => 
    bigTallSizes.some(size => item.variant?.title?.includes(size))
  )
  
  if (hasBigTallItem) {
    const [groups] = await customerModuleService.listAndCountCustomerGroups({
      name: "Big & Tall"
    })
    
    if (groups.length > 0) {
      await customerModuleService.addCustomerToGroup({
        customer_id: customer.id,
        customer_group_id: groups[0].id
      })
      console.log(`👔 Customer added to Big & Tall segment`)
    }
  }
  
  // Check for High AOV
  if (order.total >= 500) {
    const [groups] = await customerModuleService.listAndCountCustomerGroups({
      name: "High AOV"
    })
    
    if (groups.length > 0) {
      await customerModuleService.addCustomerToGroup({
        customer_id: customer.id,
        customer_group_id: groups[0].id
      })
      console.log(`💰 Customer added to High AOV segment`)
    }
  }
  
  // Check for Prom/Formal
  const formalCategories = ["prom", "tuxedo", "formal"]
  const hasFormalItem = order.items?.some(item => 
    formalCategories.some(cat => 
      item.product?.categories?.some(c => c.name?.toLowerCase().includes(cat))
    )
  )
  
  if (hasFormalItem) {
    const [groups] = await customerModuleService.listAndCountCustomerGroups({
      name: "Prom Customer"
    })
    
    if (groups.length > 0) {
      await customerModuleService.addCustomerToGroup({
        customer_id: customer.id,
        customer_group_id: groups[0].id
      })
      console.log(`🎊 Customer added to Prom Customer segment`)
    }
  }
}

/**
 * Send conversion email to guest purchasers
 */
async function sendConversionEmail(email: string, orderId: string, container: any) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  
  try {
    await notificationModuleService.createNotifications({
      to: email,
      channel: 'email',
      template: 'guest-conversion',
      data: {
        emailOptions: {
          subject: 'Save 10% on Your Next Order - Create Your Account!'
        },
        order_id: orderId,
        discount_code: 'WELCOME10',
        benefits: [
          'Track all your orders in one place',
          'Save your measurements for perfect fit',
          'Get exclusive member-only offers',
          'Earn loyalty points on every purchase'
        ]
      }
    })
    
    console.log(`📧 Conversion email sent to ${email}`)
  } catch (error) {
    console.error('Error sending conversion email:', error)
  }
}

/**
 * Calculate conversion rate for tracking
 */
function calculateConversionRate(guestTracking: any[]): number {
  if (guestTracking.length === 0) return 0
  
  const converted = guestTracking.filter(g => g.conversion_status === 'converted').length
  return Math.round((converted / guestTracking.length) * 100)
}

// Export subscriber definitions
export default [
  {
    identifier: 'guest-purchase-tracker',
    event: 'order.placed',
    subscriber: handleGuestPurchase,
  },
  {
    identifier: 'customer-registration-tracker',
    event: 'customer.created',
    subscriber: handleCustomerRegistration,
  },
  {
    identifier: 'customer-purchase-tracker',
    event: 'order.placed',
    subscriber: handleCustomerPurchase,
  },
]