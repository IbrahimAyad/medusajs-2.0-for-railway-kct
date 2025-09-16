/**
 * Cache clearing utility for backend deployment transition
 * Clears all cached product data to ensure fresh prices are fetched
 */

/**
 * Clear all cached product data
 * Run this after backend deployment to ensure fresh data
 */
export const clearProductCache = () => {
  // Clear localStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('product') || 
        key.includes('price') || 
        key.includes('cache') ||
        key.includes('medusa')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cached items from localStorage`);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }

  // Clear sessionStorage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('product') || 
        key.includes('price') || 
        key.includes('cache') ||
        key.includes('medusa')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} cached items from sessionStorage`);
  } catch (error) {
    console.error('Failed to clear sessionStorage:', error);
  }

  // Clear in-memory cache if it exists
  if (typeof window !== 'undefined' && (window as any).__productCache) {
    (window as any).__productCache = {};
    console.log('Cleared in-memory product cache');
  }

  // Force reload of product data
  if (typeof window !== 'undefined') {
    // Trigger a custom event that components can listen to
    window.dispatchEvent(new Event('product-cache-cleared'));
  }
};

/**
 * Check if backend has been updated
 * Call this to verify new pricing structure is working
 */
export const checkBackendUpdate = async (): Promise<boolean> => {
  try {
    const response = await fetch('/store/products?limit=1');
    if (!response.ok) return false;
    
    const data = await response.json();
    const product = data.products?.[0];
    
    if (!product) return false;
    
    // Check if new structure exists
    const hasNewStructure = 
      product.price > 0 || // Product-level price populated
      product.variants?.[0]?.calculated_price?.calculated_amount !== undefined;
    
    if (hasNewStructure) {
      console.log('✅ Backend update detected - new pricing structure active');
      return true;
    } else {
      console.log('⏳ Backend update pending - still using old structure');
      return false;
    }
  } catch (error) {
    console.error('Failed to check backend status:', error);
    return false;
  }
};

/**
 * Monitor backend and auto-clear cache when update is detected
 * Run this after deployment to automatically clear cache when ready
 */
export const monitorBackendUpdate = (intervalMs = 30000) => {
  let checkCount = 0;
  const maxChecks = 20; // Stop after 10 minutes
  
  const checkInterval = setInterval(async () => {
    checkCount++;
    console.log(`Checking backend update status (${checkCount}/${maxChecks})...`);
    
    const isUpdated = await checkBackendUpdate();
    
    if (isUpdated) {
      console.log('🎉 Backend update detected! Clearing cache...');
      clearProductCache();
      clearInterval(checkInterval);
      
      // Show notification if possible
      if (typeof window !== 'undefined' && 'Notification' in window) {
        new Notification('Backend Updated', {
          body: 'Product prices have been updated. Page will refresh.',
          icon: '/favicon.ico'
        });
      }
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (checkCount >= maxChecks) {
      console.log('⏹️ Stopping backend monitoring after 10 minutes');
      clearInterval(checkInterval);
    }
  }, intervalMs);
  
  return checkInterval;
};

// Export for use in components
export default {
  clearProductCache,
  checkBackendUpdate,
  monitorBackendUpdate
};