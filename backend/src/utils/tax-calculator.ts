/**
 * Simple tax calculation utility for checkout flows
 * This provides basic tax calculation when the full Stripe Tax service isn't available
 */

interface TaxCalculationOptions {
  subtotal: number
  shipping_address: {
    country_code: string
    province: string
    city?: string
    postal_code?: string
  }
  currency_code?: string
}

interface TaxBreakdown {
  subtotal: number
  tax_total: number
  tax_rate: number
  tax_name: string
  total: number
  tax_details: {
    rate: number
    name: string
    jurisdiction: string
    amount: number
  }[]
}

/**
 * Calculate tax for an order based on shipping address
 */
export function calculateTax(options: TaxCalculationOptions): TaxBreakdown {
  const { subtotal, shipping_address, currency_code = 'usd' } = options
  
  // Get tax rate based on location
  const taxInfo = getTaxRate(shipping_address)
  
  // Calculate tax amount (keep precision, don't round to integer)
  const tax_total = parseFloat((subtotal * taxInfo.rate).toFixed(2))
  const total = subtotal + tax_total
  
  return {
    subtotal,
    tax_total,
    tax_rate: taxInfo.rate,
    tax_name: taxInfo.name,
    total,
    tax_details: [{
      rate: taxInfo.rate,
      name: taxInfo.name,
      jurisdiction: taxInfo.jurisdiction,
      amount: tax_total
    }]
  }
}

/**
 * Get tax rate based on shipping address
 */
function getTaxRate(address: TaxCalculationOptions['shipping_address']): {
  rate: number
  name: string
  jurisdiction: string
} {
  const country = address.country_code?.toUpperCase()
  const state = address.province?.toUpperCase()
  
  // US state sales tax rates
  if (country === 'US') {
    const usTaxRates: Record<string, { rate: number; name: string }> = {
      'MI': { rate: 0.06, name: 'Michigan Sales Tax' }, // 6% for Michigan
      'MICHIGAN': { rate: 0.06, name: 'Michigan Sales Tax' },
      'CA': { rate: 0.0725, name: 'California Sales Tax' }, // Base rate
      'CALIFORNIA': { rate: 0.0725, name: 'California Sales Tax' },
      'NY': { rate: 0.08, name: 'New York Sales Tax' },
      'NEW YORK': { rate: 0.08, name: 'New York Sales Tax' },
      'TX': { rate: 0.0625, name: 'Texas Sales Tax' },
      'TEXAS': { rate: 0.0625, name: 'Texas Sales Tax' },
      'FL': { rate: 0.06, name: 'Florida Sales Tax' },
      'FLORIDA': { rate: 0.06, name: 'Florida Sales Tax' },
      'WA': { rate: 0.065, name: 'Washington Sales Tax' },
      'WASHINGTON': { rate: 0.065, name: 'Washington Sales Tax' },
      'OR': { rate: 0, name: 'Oregon (No Sales Tax)' },
      'OREGON': { rate: 0, name: 'Oregon (No Sales Tax)' },
      'MT': { rate: 0, name: 'Montana (No Sales Tax)' },
      'MONTANA': { rate: 0, name: 'Montana (No Sales Tax)' },
      'NH': { rate: 0, name: 'New Hampshire (No Sales Tax)' },
      'NEW HAMPSHIRE': { rate: 0, name: 'New Hampshire (No Sales Tax)' },
      'DE': { rate: 0, name: 'Delaware (No Sales Tax)' },
      'DELAWARE': { rate: 0, name: 'Delaware (No Sales Tax)' },
    }
    
    const stateInfo = usTaxRates[state] || { rate: 0.07, name: 'US Sales Tax (Avg)' }
    
    return {
      rate: stateInfo.rate,
      name: stateInfo.name,
      jurisdiction: `${state || 'US'}, United States`
    }
  }
  
  // Canada provinces
  if (country === 'CA') {
    const canadaTaxRates: Record<string, { rate: number; name: string }> = {
      'ON': { rate: 0.13, name: 'HST' }, // Ontario
      'ONTARIO': { rate: 0.13, name: 'HST' },
      'QC': { rate: 0.14975, name: 'GST + QST' }, // Quebec
      'QUEBEC': { rate: 0.14975, name: 'GST + QST' },
      'BC': { rate: 0.12, name: 'GST + PST' }, // British Columbia
      'BRITISH COLUMBIA': { rate: 0.12, name: 'GST + PST' },
      'AB': { rate: 0.05, name: 'GST' }, // Alberta
      'ALBERTA': { rate: 0.05, name: 'GST' },
    }
    
    const provinceInfo = canadaTaxRates[state] || { rate: 0.05, name: 'GST' }
    
    return {
      rate: provinceInfo.rate,
      name: provinceInfo.name,
      jurisdiction: `${state || 'CA'}, Canada`
    }
  }
  
  // European countries (VAT)
  if (['GB', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'SE', 'DK', 'FI', 'IE'].includes(country)) {
    const europeanVAT: Record<string, { rate: number; name: string }> = {
      'GB': { rate: 0.20, name: 'VAT' },
      'UK': { rate: 0.20, name: 'VAT' },
      'DE': { rate: 0.19, name: 'VAT' },
      'FR': { rate: 0.20, name: 'TVA' },
      'IT': { rate: 0.22, name: 'IVA' },
      'ES': { rate: 0.21, name: 'IVA' },
      'NL': { rate: 0.21, name: 'BTW' },
      'BE': { rate: 0.21, name: 'TVA/BTW' },
      'AT': { rate: 0.20, name: 'USt' },
      'SE': { rate: 0.25, name: 'MOMS' },
      'DK': { rate: 0.25, name: 'MOMS' },
      'FI': { rate: 0.24, name: 'ALV' },
      'IE': { rate: 0.23, name: 'VAT' },
    }
    
    const vatInfo = europeanVAT[country] || { rate: 0.20, name: 'VAT' }
    
    return {
      rate: vatInfo.rate,
      name: vatInfo.name,
      jurisdiction: `${country}, European Union`
    }
  }
  
  // No tax for other countries or unrecognized locations
  return {
    rate: 0,
    name: 'No Tax',
    jurisdiction: country || 'Unknown'
  }
}

/**
 * Format tax amount for display
 */
export function formatTaxAmount(amount: number, currency_code: string = 'usd'): string {
  const formatted = (amount / 100).toFixed(2)
  
  const currencySymbols: Record<string, string> = {
    'usd': '$',
    'eur': '€',
    'gbp': '£',
    'cad': 'C$',
  }
  
  const symbol = currencySymbols[currency_code.toLowerCase()] || '$'
  return `${symbol}${formatted}`
}

/**
 * Get tax summary text for an order
 */
export function getTaxSummary(breakdown: TaxBreakdown, currency_code: string = 'usd'): string {
  if (breakdown.tax_total === 0) {
    return 'No tax applied'
  }
  
  const taxAmount = formatTaxAmount(breakdown.tax_total, currency_code)
  const taxRate = (breakdown.tax_rate * 100).toFixed(2)
  
  return `${breakdown.tax_name} (${taxRate}%): ${taxAmount}`
}