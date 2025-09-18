import { Text, Section, Hr, Img, Row, Column, Button } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been confirmed!' }) => {
  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode.toUpperCase()
    }).format(amount / 100)
  }

  return (
    <Base preview={preview}>
      {/* Header with KCT Menswear Branding */}
      <Section style={{ backgroundColor: '#1a1a1a', padding: '20px 0', textAlign: 'center' }}>
        <Text style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          margin: '0',
          letterSpacing: '2px'
        }}>
          KCT MENSWEAR
        </Text>
        <Text style={{ 
          fontSize: '14px', 
          color: '#cccccc', 
          margin: '5px 0 0',
          letterSpacing: '1px'
        }}>
          PREMIUM MEN'S FORMAL WEAR
        </Text>
      </Section>

      {/* Order Confirmation Message */}
      <Section style={{ padding: '40px 20px 20px' }}>
        <Text style={{ 
          fontSize: '26px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          margin: '0 0 10px',
          color: '#1a1a1a'
        }}>
          Order Confirmed!
        </Text>
        
        <Text style={{ 
          fontSize: '16px',
          textAlign: 'center',
          margin: '0 0 30px',
          color: '#666666'
        }}>
          Thank you for choosing KCT Menswear. Your order is being processed.
        </Text>

        <Text style={{ 
          fontSize: '18px',
          margin: '0 0 15px',
          color: '#1a1a1a'
        }}>
          Dear {shippingAddress.first_name} {shippingAddress.last_name},
        </Text>

        <Text style={{ 
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 30px',
          color: '#444444'
        }}>
          We're excited to confirm that your order has been received and is now being prepared. 
          You'll receive another email with tracking information once your items have shipped.
        </Text>
      </Section>

      {/* Order Summary Card */}
      <Section style={{ padding: '0 20px' }}>
        <div style={{
          backgroundColor: '#f8f8f8',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          margin: '0 0 30px'
        }}>
          <Text style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            margin: '0 0 15px',
            color: '#1a1a1a'
          }}>
            Order Summary
          </Text>
          
          <Row>
            <Column>
              <Text style={{ margin: '0 0 8px', color: '#666666' }}>
                <strong>Order ID:</strong> {order.display_id}
              </Text>
              <Text style={{ margin: '0 0 8px', color: '#666666' }}>
                <strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Column>
            <Column align="right">
              <Text style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0',
                color: '#1a1a1a'
              }}>
                {formatCurrency(order.summary.raw_current_order_total.value, order.currency_code)}
              </Text>
            </Column>
          </Row>
        </div>
      </Section>

      {/* Order Items */}
      <Section style={{ padding: '0 20px' }}>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: '0 0 20px',
          color: '#1a1a1a'
        }}>
          Order Items
        </Text>

        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text style={{ fontWeight: 'bold', color: '#ffffff', margin: '0', flex: '2' }}>Item</Text>
            <Text style={{ fontWeight: 'bold', color: '#ffffff', margin: '0', textAlign: 'center', flex: '1' }}>Qty</Text>
            <Text style={{ fontWeight: 'bold', color: '#ffffff', margin: '0', textAlign: 'right', flex: '1' }}>Price</Text>
          </div>

          {/* Table Rows */}
          {order.items.map((item, index) => (
            <div key={item.id} style={{
              padding: '15px',
              borderBottom: index < order.items.length - 1 ? '1px solid #e0e0e0' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9'
            }}>
              <div style={{ flex: '2' }}>
                <Text style={{ 
                  margin: '0 0 5px',
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                }}>
                  {item.product_title}
                </Text>
                <Text style={{ 
                  margin: '0',
                  fontSize: '14px',
                  color: '#666666'
                }}>
                  {item.title}
                </Text>
              </div>
              <Text style={{ 
                margin: '0',
                textAlign: 'center',
                flex: '1',
                color: '#1a1a1a'
              }}>
                {item.quantity}
              </Text>
              <Text style={{ 
                margin: '0',
                textAlign: 'right',
                flex: '1',
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}>
                {formatCurrency(item.unit_price * item.quantity, order.currency_code)}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      {/* Shipping Information */}
      <Section style={{ padding: '30px 20px 20px' }}>
        <Text style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: '0 0 15px',
          color: '#1a1a1a'
        }}>
          Shipping Address
        </Text>
        
        <div style={{
          backgroundColor: '#f8f8f8',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <Text style={{ margin: '0 0 5px', color: '#1a1a1a', fontWeight: 'bold' }}>
            {shippingAddress.first_name} {shippingAddress.last_name}
          </Text>
          <Text style={{ margin: '0 0 5px', color: '#666666' }}>
            {shippingAddress.address_1}
          </Text>
          {shippingAddress.address_2 && (
            <Text style={{ margin: '0 0 5px', color: '#666666' }}>
              {shippingAddress.address_2}
            </Text>
          )}
          <Text style={{ margin: '0 0 5px', color: '#666666' }}>
            {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
          </Text>
          <Text style={{ margin: '0', color: '#666666' }}>
            {shippingAddress.country_code?.toUpperCase()}
          </Text>
        </div>
      </Section>

      {/* Next Steps */}
      <Section style={{ padding: '20px', backgroundColor: '#f8f8f8' }}>
        <Text style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          margin: '0 0 15px',
          color: '#1a1a1a'
        }}>
          What's Next?
        </Text>
        
        <Text style={{ 
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
          color: '#444444'
        }}>
          • We'll process your order within 1-2 business days<br/>
          • You'll receive tracking information via email once shipped<br/>
          • Estimated delivery: 3-7 business days<br/>
          • For any questions, contact us at info@kctmenswear.com
        </Text>

        <div style={{ textAlign: 'center', margin: '30px 0 0' }}>
          <Button
            href="mailto:info@kctmenswear.com"
            style={{
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              padding: '12px 30px',
              textDecoration: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              display: 'inline-block'
            }}
          >
            Contact Us
          </Button>
        </div>
      </Section>

      {/* Footer */}
      <Section style={{ 
        padding: '30px 20px',
        textAlign: 'center',
        backgroundColor: '#1a1a1a'
      }}>
        <Text style={{ 
          fontSize: '14px',
          color: '#cccccc',
          margin: '0 0 10px'
        }}>
          Thank you for choosing KCT Menswear
        </Text>
        <Text style={{ 
          fontSize: '12px',
          color: '#999999',
          margin: '0'
        }}>
          Premium Men's Formal Wear | Suits • Tuxedos • Accessories
        </Text>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'USD',
    items: [
      { id: 'item-1', title: 'Item 1', product_title: 'Product 1', quantity: 2, unit_price: 10 },
      { id: 'item-2', title: 'Item 2', product_title: 'Product 2', quantity: 1, unit_price: 25 }
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Main St',
      city: 'Anytown',
      province: 'CA',
      postal_code: '12345',
      country_code: 'US'
    },
    summary: { raw_current_order_total: { value: 45 } }
  },
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User',
    address_1: '123 Main St',
    city: 'Anytown',
    province: 'CA',
    postal_code: '12345',
    country_code: 'US'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
