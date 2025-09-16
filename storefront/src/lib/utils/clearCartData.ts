/**
 * Clear all cart-related data from localStorage
 * This helps prevent stale cart items from persisting
 */
export function clearAllCartData() {
  if (typeof window === 'undefined') return;
  
  // Clear various cart storage keys
  const cartKeys = [
    'cart-storage',
    'medusa_cart_id',
    'cart_id',
    'kct-cart',
    'cart-items',
    'guest_cart_id',
    'temp_cart'
  ];
  
  cartKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key}:`, e);
    }
  });
  
  // Clear session storage as well
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Failed to clear session storage:', e);
  }
  
  console.log('All cart data cleared');
}

/**
 * Get a fresh cart ID from Medusa
 */
export async function initializeFreshCart() {
  clearAllCartData();
  
  // The cart will be initialized fresh on next page load
  // by the useMedusaCart hook
  return true;
}