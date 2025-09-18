import { Text, Section, Hr, Button } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ORDER_SHIPPED = 'order-shipped'

interface OrderShippedPreviewProps {
  order: OrderDTO & { display_id: string }
  shippingAddress: OrderAddressDTO
  tracking?: {
    tracking_number: string
    carrier: string
  }
}

export interface OrderShippedTemplateProps {
  order: OrderDTO & { display_id: string }
  shippingAddress: OrderAddressDTO
  tracking?: {
    tracking_number: string
    carrier: string
  }
  preview?: string
}

export const isOrderShippedTemplateData = (data: any): data is OrderShippedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderShippedTemplate: React.FC<OrderShippedTemplateProps> & {
  PreviewProps: OrderShippedPreviewProps
} = ({ order, shippingAddress, tracking, preview = 'Your order has been shipped!' }) => {
  
  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const trackingUrls: Record<string, string> = {
      'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
      'fedex': `https://www.fedex.com/fedextrack/?tracknumber=${trackingNumber}`,
      'usps': `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`,
      'dhl': `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`
    }
    
    return trackingUrls[carrier.toLowerCase()] || `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`
  }

  return (
    <Base preview={preview}>
      {/* Header */}
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

      {/* Shipped Message */}
      <Section style={{ padding: '40px 20px 20px' }}>
        <Text style={{ 
          fontSize: '26px', 
          fontWeight: 'bold', 
          textAlign: 'center', 
          margin: '0 0 10px',
          color: '#1a1a1a'
        }}>
          📦 Your Order Has Shipped!
        </Text>
        
        <Text style={{ 
          fontSize: '16px',
          textAlign: 'center',
          margin: '0 0 30px',
          color: '#666666'
        }}>
          Your KCT Menswear order is on its way to you.
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
          Great news! Your order has been shipped and is on its way to you. 
          {tracking ? ' You can track your package using the information below.' : ' You should receive it within 3-7 business days.'}
        </Text>
      </Section>

      {/* Order Info */}
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
            Order Information
          </Text>
          
          <Text style={{ margin: '0 0 8px', color: '#666666' }}>
            <strong>Order ID:</strong> {order.display_id}
          </Text>
          <Text style={{ margin: '0 0 8px', color: '#666666' }}>
            <strong>Shipped Date:</strong> {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </div>
      </Section>

      {/* Tracking Information */}
      {tracking && (
        <Section style={{ padding: '0 20px' }}>
          <div style={{
            backgroundColor: '#e8f5e8',
            border: '2px solid #4CAF50',
            borderRadius: '8px',
            padding: '20px',
            margin: '0 0 30px',
            textAlign: 'center'
          }}>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              margin: '0 0 15px',
              color: '#1a1a1a'
            }}>
              📍 Tracking Information
            </Text>
            
            <Text style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 10px',
              color: '#1a1a1a'
            }}>
              Tracking Number: {tracking.tracking_number}
            </Text>
            
            <Text style={{ 
              fontSize: '16px',
              margin: '0 0 20px',
              color: '#666666'
            }}>
              Carrier: {tracking.carrier}
            </Text>

            <Button
              href={getTrackingUrl(tracking.carrier, tracking.tracking_number)}
              style={{
                backgroundColor: '#4CAF50',
                color: '#ffffff',
                padding: '12px 30px',
                textDecoration: 'none',
                borderRadius: '5px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
            >
              Track Your Package
            </Button>
          </div>
        </Section>
      )}

      {/* Shipping Address */}
      <Section style={{ padding: '0 20px' }}>
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
          padding: '20px',
          margin: '0 0 30px'
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

      {/* Delivery Info */}
      <Section style={{ padding: '20px', backgroundColor: '#f8f8f8' }}>
        <Text style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          margin: '0 0 15px',
          color: '#1a1a1a'
        }}>
          Delivery Information
        </Text>
        
        <Text style={{ 
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 15px',
          color: '#444444'
        }}>
          • Estimated delivery: 3-7 business days<br/>
          • Someone should be available to receive the package<br/>
          • If you're not home, the carrier may leave a delivery notice<br/>
          • Contact us at info@kctmenswear.com for any delivery concerns
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
            Contact Support
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

OrderShippedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com'
  },
  shippingAddress: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'Anytown',
    province: 'CA',
    postal_code: '12345',
    country_code: 'US'
  },
  tracking: {
    tracking_number: '1Z999AA1234567890',
    carrier: 'UPS'
  }
} as OrderShippedPreviewProps

export default OrderShippedTemplate