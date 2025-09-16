import { NextResponse } from 'next/server'
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client'

export async function GET() {
  try {
    // Test various Medusa endpoints
    const tests = {
      regions: null as any,
      products: null as any,
      paymentProviders: null as any,
      error: null as any
    }

    // 1. Test regions
    try {
      const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/regions`, {
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        }
      })
      
      if (regionsResponse.ok) {
        const { regions } = await regionsResponse.json()
        tests.regions = {
          count: regions.length,
          regions: regions.map((r: any) => ({
            id: r.id,
            name: r.name,
            currency_code: r.currency_code,
            countries: r.countries?.map((c: any) => c.iso_2)
          }))
        }
      }
    } catch (err) {
      tests.regions = { error: String(err) }
    }

    // 2. Test products
    try {
      const products = await medusa.store.product.list({ limit: 5 })
      tests.products = {
        count: products.products?.length || 0,
        sample: products.products?.slice(0, 2).map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle
        }))
      }
    } catch (err) {
      tests.products = { error: String(err) }
    }

    // 3. Test payment providers
    try {
      const providersResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payment-providers?region_id=${MEDUSA_CONFIG.regionId}`, {
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
        }
      })
      
      if (providersResponse.ok) {
        const { payment_providers } = await providersResponse.json()
        tests.paymentProviders = payment_providers
      }
    } catch (err) {
      tests.paymentProviders = { error: String(err) }
    }

    return NextResponse.json({
      success: true,
      backend_url: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
      has_publishable_key: !!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
      tests
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}