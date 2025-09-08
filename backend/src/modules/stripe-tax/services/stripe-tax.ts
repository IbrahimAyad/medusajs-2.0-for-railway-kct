import { 
  ITaxProvider, 
  TaxCalculationContext,
  Logger
} from '@medusajs/framework/types'
import Stripe from 'stripe'

type InjectedDependencies = {
  logger: Logger
}

interface StripeTaxServiceOptions {
  api_key: string
  automatic_tax: boolean
}

// Item with tax calculation info
interface ItemTaxCalculation {
  line_item_id: string
  rate: number
  name: string
  code: string
  provider_id: string
}

// Shipping with tax calculation info  
interface ShippingTaxCalculation {
  shipping_line_id: string
  rate: number
  name: string
  code: string
  provider_id: string
}

export class StripeTaxService implements ITaxProvider {
  static identifier = "stripe-tax"
  protected logger_: Logger
  protected stripe: Stripe
  protected automaticTax: boolean

  constructor(
    { logger }: InjectedDependencies,
    options: StripeTaxServiceOptions
  ) {
    this.logger_ = logger
    this.stripe = new Stripe(options.api_key, {
      apiVersion: '2024-11-20.acacia'
    })
    this.automaticTax = options.automatic_tax ?? true
  }

  getIdentifier(): string {
    return StripeTaxService.identifier
  }

  async getTaxLines(
    itemLines: any[],
    shippingLines: any[],
    context: TaxCalculationContext
  ): Promise<(ItemTaxCalculation | ShippingTaxCalculation)[]> {
    if (!this.automaticTax || !context.address) {
      return this.getEmptyTaxLines(itemLines, shippingLines)
    }

    try {
      // Use Stripe Tax API for accurate US state/local taxes
      const taxCalculation = await this.calculateStripeTax(
        itemLines,
        shippingLines,
        context
      )

      return this.mapStripeTaxToMedusa(
        itemLines,
        shippingLines,
        taxCalculation
      )
    } catch (error) {
      this.logger_.error('Stripe Tax calculation failed:', error)
      // Fall back to simple rates if Stripe Tax fails
      return this.getFallbackTaxLines(itemLines, shippingLines, context)
    }
  }

  private async calculateStripeTax(
    itemLines: any[],
    shippingLines: any[],
    context: TaxCalculationContext
  ): Promise<Stripe.Tax.Calculation> {
    const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = []

    // Add product line items
    for (const item of itemLines) {
      const amount = item.unit_price || item.amount || 0
      const quantity = item.quantity || 1
      
      lineItems.push({
        amount: Math.round(amount * quantity), // Amount in cents
        quantity: quantity,
        reference: item.id || item.line_item_id,
        tax_behavior: 'exclusive',
        // Tax code for clothing/apparel
        tax_code: 'txcd_99999999' // General tangible goods (clothing)
      })
    }

    // Add shipping line items
    for (const shipping of shippingLines) {
      const amount = shipping.unit_price || shipping.amount || 0
      
      lineItems.push({
        amount: Math.round(amount), // Amount in cents
        quantity: 1,
        reference: shipping.id || shipping.shipping_line_id,
        tax_behavior: 'exclusive',
        tax_code: 'txcd_92010001' // Shipping & handling
      })
    }

    // Create the calculation with address
    const calculation = await this.stripe.tax.calculations.create({
      currency: 'usd', // Default to USD, you can pass this from context if needed
      line_items: lineItems,
      customer_details: {
        address: {
          line1: context.address.address_1 || '',
          line2: context.address.address_2 || undefined,
          city: context.address.city || '',
          state: context.address.province_code || '',
          postal_code: context.address.postal_code || '',
          country: context.address.country_code?.toUpperCase() || 'US'
        },
        address_source: 'shipping'
      },
      expand: ['line_items.data.tax_breakdown']
    })

    this.logger_.info(`Stripe Tax calculated for ${context.address.country_code}: ${calculation.tax_amount_exclusive} cents`)
    
    return calculation
  }

  private mapStripeTaxToMedusa(
    itemLines: any[],
    shippingLines: any[],
    calculation: Stripe.Tax.Calculation
  ): (ItemTaxCalculation | ShippingTaxCalculation)[] {
    const result: (ItemTaxCalculation | ShippingTaxCalculation)[] = []

    // Process each line item from Stripe
    for (const stripeLine of calculation.line_items?.data || []) {
      // Calculate effective tax rate
      const effectiveRate = stripeLine.amount_tax / stripeLine.amount
      
      // Get tax breakdown details
      let taxName = 'Sales Tax'
      let taxCode = 'TAX'
      
      if (stripeLine.tax_breakdown && stripeLine.tax_breakdown.length > 0) {
        const breakdown = stripeLine.tax_breakdown[0]
        taxName = breakdown.tax_rate_details?.display_name || 
                  `${breakdown.jurisdiction?.display_name || ''} Tax`.trim() || 
                  'Sales Tax'
        taxCode = breakdown.jurisdiction?.state || 
                  breakdown.jurisdiction?.country || 
                  'TAX'
      }

      // Find matching item or shipping line
      const matchingItem = itemLines.find(
        item => (item.id || item.line_item_id) === stripeLine.reference
      )
      
      if (matchingItem) {
        result.push({
          line_item_id: matchingItem.id || matchingItem.line_item_id,
          rate: effectiveRate,
          name: taxName,
          code: taxCode,
          provider_id: 'tp_stripe-tax_stripe-tax'
        })
      } else {
        const matchingShipping = shippingLines.find(
          shipping => (shipping.id || shipping.shipping_line_id) === stripeLine.reference
        )
        
        if (matchingShipping) {
          result.push({
            shipping_line_id: matchingShipping.id || matchingShipping.shipping_line_id,
            rate: effectiveRate,
            name: `Shipping ${taxName}`,
            code: `SHIP_${taxCode}`,
            provider_id: 'tp_stripe-tax_stripe-tax'
          })
        }
      }
    }

    // Add zero tax for any items not in Stripe response
    for (const item of itemLines) {
      const itemId = item.id || item.line_item_id
      if (!result.find(r => 'line_item_id' in r && r.line_item_id === itemId)) {
        result.push({
          line_item_id: itemId,
          rate: 0,
          name: 'No Tax',
          code: 'NONE',
          provider_id: 'tp_stripe-tax_stripe-tax'
        })
      }
    }

    for (const shipping of shippingLines) {
      const shippingId = shipping.id || shipping.shipping_line_id
      if (!result.find(r => 'shipping_line_id' in r && r.shipping_line_id === shippingId)) {
        result.push({
          shipping_line_id: shippingId,
          rate: 0,
          name: 'No Tax',
          code: 'NONE',
          provider_id: 'tp_stripe-tax_stripe-tax'
        })
      }
    }

    return result
  }

  private getFallbackTaxLines(
    itemLines: any[],
    shippingLines: any[],
    context: TaxCalculationContext
  ): (ItemTaxCalculation | ShippingTaxCalculation)[] {
    // Simple fallback rates if Stripe Tax API fails
    const taxRate = this.getFallbackTaxRate(context)
    const taxName = this.getTaxName(context)
    const result: (ItemTaxCalculation | ShippingTaxCalculation)[] = []

    for (const item of itemLines) {
      result.push({
        line_item_id: item.id || item.line_item_id,
        rate: taxRate,
        name: taxName,
        code: context.address?.country_code || 'TAX',
        provider_id: 'tp_stripe-tax_stripe-tax'
      })
    }

    for (const shipping of shippingLines) {
      result.push({
        shipping_line_id: shipping.id || shipping.shipping_line_id,
        rate: taxRate,
        name: `Shipping ${taxName}`,
        code: `SHIP_${context.address?.country_code || 'TAX'}`,
        provider_id: 'tp_stripe-tax_stripe-tax'
      })
    }

    return result
  }

  private getFallbackTaxRate(context: TaxCalculationContext): number {
    if (!context.address) return 0
    
    const country = context.address.country_code?.toUpperCase()
    
    // Basic fallback rates
    switch(country) {
      case 'US':
        // Average US sales tax (actual will vary by state)
        return 0.07
      case 'CA':
        return 0.05 // Canadian GST
      case 'GB':
      case 'UK':
        return 0.20 // UK VAT
      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
        return 0.19 // EU VAT
      default:
        return 0
    }
  }

  private getTaxName(context: TaxCalculationContext): string {
    const country = context.address?.country_code?.toUpperCase()
    
    switch(country) {
      case 'US':
        return 'Sales Tax'
      case 'CA':
        return 'GST'
      case 'GB':
      case 'UK':
      case 'DE':
      case 'FR':
      case 'IT':
      case 'ES':
        return 'VAT'
      default:
        return 'Tax'
    }
  }

  private getEmptyTaxLines(
    itemLines: any[],
    shippingLines: any[]
  ): (ItemTaxCalculation | ShippingTaxCalculation)[] {
    const result: (ItemTaxCalculation | ShippingTaxCalculation)[] = []

    for (const item of itemLines) {
      result.push({
        line_item_id: item.id || item.line_item_id,
        rate: 0,
        name: 'No Tax',
        code: 'NONE',
        provider_id: 'tp_stripe-tax_stripe-tax'
      })
    }

    for (const shipping of shippingLines) {
      result.push({
        shipping_line_id: shipping.id || shipping.shipping_line_id,
        rate: 0,
        name: 'No Tax',
        code: 'NONE',
        provider_id: 'tp_stripe-tax_stripe-tax'
      })
    }

    return result
  }
}