/**
 * Format price for display
 * IMPORTANT: Medusa 2.0 returns amount field already in DOLLARS, not cents!
 * 
 * @param amount - Price in dollars (e.g., 49.99 for $49.99)
 * @param currencyCode - Currency code (default: 'USD')
 * @returns Formatted price string (e.g., "$49.99")
 */
export const formatPrice = (amount: number | undefined | null, currencyCode: string = 'USD'): string => {
  if (!amount && amount !== 0) return '$0.00';
  
  // Handle different currencies
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  // DO NOT divide by 100 - Medusa 2.0 amount is already in dollars!
  return formatter.format(amount);
};

/**
 * Format price range for products with variants
 * @param variants - Product variants array
 * @returns Price range string (e.g., "$99.99" or "$99.99 - $199.99")
 */
export const formatPriceRange = (variants: any[]): string => {
  if (!variants || variants.length === 0) return '$0.00';
  
  const prices = variants.flatMap(v => 
    v.prices?.map((p: any) => p.amount) || []
  ).filter(Boolean);
  
  if (prices.length === 0) return '$0.00';
  
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) {
    return formatPrice(min);
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`;
};

/**
 * Convert user input price for Medusa 2.0
 * NOTE: Medusa 2.0 expects prices in dollars, not cents
 * @param dollarAmount - Price in dollars (e.g., "49.99")
 * @returns Price in dollars (e.g., 49.99)
 */
export const priceToCents = (dollarAmount: string | number): number => {
  const amount = typeof dollarAmount === 'string' 
    ? parseFloat(dollarAmount) 
    : dollarAmount;
  
  // Medusa 2.0 expects dollars, not cents - just return the amount
  return amount;
};