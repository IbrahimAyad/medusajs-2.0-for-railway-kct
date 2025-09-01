import { 
  ITaxProvider, 
  TaxCalculationContext,
  ItemTaxLineDTO,
  ShippingTaxLineDTO,
  TaxLineDTO,
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

  async getTaxLines(
    itemLines: ItemTaxLineDTO[],
    shippingLines: ShippingTaxLineDTO[],
    context: TaxCalculationContext
  ): Promise<(ItemTaxLineDTO | ShippingTaxLineDTO)[]> {
    if (!this.automaticTax) {
      // Return empty tax lines if automatic tax is disabled
      return this.getEmptyTaxLines(itemLines, shippingLines)
    }

    try {
      // Create a Stripe Tax Calculation
      const taxCalculation = await this.createTaxCalculation(
        itemLines,
        shippingLines,
        context
      )

      // Map Stripe tax lines to Medusa format
      return this.mapStripeTaxLines(
        itemLines,
        shippingLines,
        taxCalculation
      )
    } catch (error) {
      this.logger_.error('Stripe Tax calculation failed:', error)
      // Fall back to zero tax on error
      return this.getEmptyTaxLines(itemLines, shippingLines)
    }
  }

  private async createTaxCalculation(
    itemLines: ItemTaxLineDTO[],
    shippingLines: ShippingTaxLineDTO[],
    context: TaxCalculationContext
  ): Promise<Stripe.Tax.Calculation> {
    const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = []

    // Add product line items
    for (const item of itemLines) {
      lineItems.push({
        amount: Math.round(item.line_item.unit_price * item.line_item.quantity * 100), // Convert to cents
        quantity: item.line_item.quantity,
        reference: item.line_item.id,
        tax_behavior: 'exclusive',
        tax_code: item.line_item.product?.tax_code || 'txcd_99999999' // General tangible goods
      })
    }

    // Add shipping line items
    for (const shipping of shippingLines) {
      lineItems.push({
        amount: Math.round(shipping.shipping_line.unit_price * 100), // Convert to cents
        quantity: 1,
        reference: shipping.shipping_line.id,
        tax_behavior: 'exclusive',
        tax_code: 'txcd_92010001' // Shipping
      })
    }

    // Create the calculation
    const calculation = await this.stripe.tax.calculations.create({
      currency: context.address?.currency_code?.toLowerCase() || 'usd',
      line_items: lineItems,
      customer_details: {
        address: context.address ? {
          line1: context.address.address_1,
          line2: context.address.address_2 || undefined,
          city: context.address.city,
          state: context.address.province,
          postal_code: context.address.postal_code,
          country: context.address.country_code?.toUpperCase() || 'US'
        } : undefined,
        address_source: 'shipping'
      },
      expand: ['line_items.data.tax_breakdown']
    })

    return calculation
  }

  private mapStripeTaxLines(
    itemLines: ItemTaxLineDTO[],
    shippingLines: ShippingTaxLineDTO[],
    calculation: Stripe.Tax.Calculation
  ): (ItemTaxLineDTO | ShippingTaxLineDTO)[] {
    const result: (ItemTaxLineDTO | ShippingTaxLineDTO)[] = []

    // Process each line item from Stripe
    for (const stripeLine of calculation.line_items?.data || []) {
      const taxLines: TaxLineDTO[] = []

      // Add tax lines from tax breakdown
      for (const taxDetail of stripeLine.tax_breakdown || []) {
        taxLines.push({
          rate_id: `stripe_${taxDetail.jurisdiction?.country}_${taxDetail.jurisdiction?.state}`,
          rate: taxDetail.percentage / 100, // Convert percentage to decimal
          name: taxDetail.tax_rate_details?.display_name || 'Tax',
          code: taxDetail.jurisdiction?.state || taxDetail.jurisdiction?.country || 'TAX',
          provider_id: 'tp_stripe-tax_stripe-tax'
        })
      }

      // Find matching item or shipping line
      const matchingItem = itemLines.find(item => item.line_item.id === stripeLine.reference)
      if (matchingItem) {
        result.push({
          ...matchingItem,
          tax_lines: taxLines
        })
      } else {
        const matchingShipping = shippingLines.find(
          shipping => shipping.shipping_line.id === stripeLine.reference
        )
        if (matchingShipping) {
          result.push({
            ...matchingShipping,
            tax_lines: taxLines
          })
        }
      }
    }

    // Add any items that weren't in the Stripe response with zero tax
    for (const item of itemLines) {
      if (!result.find(r => 'line_item' in r && r.line_item.id === item.line_item.id)) {
        result.push({
          ...item,
          tax_lines: []
        })
      }
    }

    for (const shipping of shippingLines) {
      if (!result.find(r => 'shipping_line' in r && r.shipping_line.id === shipping.shipping_line.id)) {
        result.push({
          ...shipping,
          tax_lines: []
        })
      }
    }

    return result
  }

  private getEmptyTaxLines(
    itemLines: ItemTaxLineDTO[],
    shippingLines: ShippingTaxLineDTO[]
  ): (ItemTaxLineDTO | ShippingTaxLineDTO)[] {
    const result: (ItemTaxLineDTO | ShippingTaxLineDTO)[] = []

    // Return items with empty tax lines
    for (const item of itemLines) {
      result.push({
        ...item,
        tax_lines: []
      })
    }

    for (const shipping of shippingLines) {
      result.push({
        ...shipping,
        tax_lines: []
      })
    }

    return result
  }
}