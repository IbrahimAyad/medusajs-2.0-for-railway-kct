import { Metadata } from "next"

import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import { notFound } from "next/navigation"
import { enrichLineItems } from "@lib/data/cart"
import { retrieveOrder } from "@lib/data/orders"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: { id: string }
  searchParams: { cart_id?: string }
}

async function getOrder(id: string) {
  const order = await retrieveOrder(id)

  if (!order) {
    return
  }

  const enrichedItems = await enrichLineItems(order.items, order.region_id!)

  return {
    ...order,
    items: enrichedItems,
  } as unknown as HttpTypes.StoreOrder
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage({ params, searchParams }: Props) {
  // Check if this is a pending order (webhook processing)
  const isPending = params.id.startsWith('pending_') || searchParams.pending === 'true'
  
  if (isPending && searchParams.cart_id) {
    console.log("[Order Page] Pending order, will poll for completion. Cart ID:", searchParams.cart_id)
    // For pending orders, create a temporary order object
    const tempOrder = {
      id: params.id,
      display_id: params.id,
      email: "Processing...",
      created_at: new Date().toISOString(),
      items: [],
      total: 0,
      currency_code: "usd",
      shipping_address: null,
      billing_address: null,
    } as unknown as HttpTypes.StoreOrder
    
    return <OrderCompletedTemplate order={tempOrder} cartId={searchParams.cart_id} isPending={true} />
  }
  
  const order = await getOrder(params.id)
  if (!order) {
    return notFound()
  }

  // Pass cart_id to template for potential order verification/polling
  return <OrderCompletedTemplate order={order} cartId={searchParams.cart_id} />
}
