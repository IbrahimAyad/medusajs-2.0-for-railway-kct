# 🎯 Frontend Preparation Guide - Critical Updates Required
## Date: September 7, 2025
## Purpose: Prepare frontend for backend pricing fix deployment

---

## ⚠️ URGENT: Backend Changes Coming

### What's Changing
The backend `/store/products` API will be fixed to return **correct pricing data**. Currently returns `price: 0`, will soon return actual prices in **cents** (e.g., 19999 = $199.99).

### Timeline
- Backend deployment: **Within next 2 hours**
- Cache expiry: **60 seconds after deployment**
- Frontend must be ready: **Before deployment**

---

## 🔴 CRITICAL: Current Issues in Frontend

### 1. **Wrong Price Fields Being Used**
```javascript
// ❌ WRONG - These fields don't exist
product.price
product.metadata?.tier_price
variant.price

// ✅ CORRECT - Use these instead
variant.calculated_price.calculated_amount  // Price in cents
product.variants[0].calculated_price.calculated_amount  // For product listing
```

### 2. **Missing Region Context**
```javascript
// ❌ WRONG - No region specified
fetch('/store/products')

// ✅ CORRECT - Always include region
fetch('/store/products?region_id=reg_01K3S6NDGAC1DSWH9MCZCWBWWD')
```

### 3. **Cents to Dollars Conversion**
```javascript
// ❌ WRONG - Displaying cents as dollars
displayPrice = price  // Shows 19999 instead of $199.99

// ✅ CORRECT - Convert cents to dollars
displayPrice = (price / 100).toFixed(2)  // Shows $199.99
```

---

## 📋 IMMEDIATE CLEANUP REQUIRED

### Step 1: Remove ALL Price Workarounds
**Files to check and clean:**
- `/src/utils/pricing.ts`
- `/src/services/medusaBackendService.ts`
- `/src/utils/product.ts`
- Any component displaying prices

**Remove these patterns:**
```javascript
// DELETE ALL OF THESE:
- Hardcoded price mappings
- Fallback prices (like "return 59.99")
- Supabase price enhancements
- Any reference to "tier_price"
- Custom price calculations
- Mock data with prices
```

### Step 2: Update Price Utility Function
**Replace your ENTIRE pricing utility with this:**
```javascript
// /src/utils/pricing.ts
export const getProductPrice = (variant: any): string => {
  // Only use calculated_price from Medusa 2.0
  const amountInCents = variant?.calculated_price?.calculated_amount || 0
  const amountInDollars = amountInCents / 100
  return amountInDollars.toFixed(2)
}

export const formatPrice = (amountInCents: number): string => {
  return `$${(amountInCents / 100).toFixed(2)}`
}

// DELETE everything else in this file
```

### Step 3: Update Product Display Components
**Every component showing prices needs this update:**
```javascript
// Product Card Component
const ProductCard = ({ product }) => {
  // Get lowest price from variants
  const lowestPrice = Math.min(
    ...product.variants.map(v => v.calculated_price?.calculated_amount || 0)
  )
  
  return (
    <div>
      <h3>{product.title}</h3>
      <p className="price">${(lowestPrice / 100).toFixed(2)}</p>
    </div>
  )
}

// Product Detail Page
const ProductDetail = ({ product, selectedVariant }) => {
  const price = selectedVariant?.calculated_price?.calculated_amount || 0
  
  return (
    <div>
      <h1>{product.title}</h1>
      <p className="price">${(price / 100).toFixed(2)}</p>
    </div>
  )
}
```

### Step 4: Update ALL API Calls
**Find and update every `/store/products` call:**
```javascript
// ❌ OLD WAY
const response = await fetch('/store/products')

// ✅ NEW WAY - Always include these parameters
const response = await fetch('/store/products?' + new URLSearchParams({
  region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',  // US region
  fields: '*variants.calculated_price',           // Request price data
  limit: '20'
}))
```

---

## 🏗️ NEW API RESPONSE STRUCTURE

### What You'll Receive After Fix:
```json
{
  "products": [
    {
      "id": "prod_xxx",
      "title": "Sand Tuxedo",
      "handle": "sand-tuxedo",
      "thumbnail": "https://...",
      "price": 19999,  // NEW: Actual price in cents (was 0)
      "currency_code": "usd",
      "variants": [
        {
          "id": "variant_xxx",
          "title": "36R",
          "calculated_price": {  // NEW: Full price object
            "calculated_amount": 19999,
            "original_amount": 19999,
            "currency_code": "usd",
            "is_calculated_price_tax_inclusive": false
          },
          "price": 19999  // NEW: Convenience field
        }
      ]
    }
  ],
  "region_id": "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
  "currency_code": "usd"
}
```

### How to Use This Data:
```javascript
// For product listings
products.map(product => {
  const displayPrice = (product.price / 100).toFixed(2)
  return <ProductCard price={`$${displayPrice}`} />
})

// For product details
const selectedPrice = selectedVariant.calculated_price.calculated_amount
const displayPrice = (selectedPrice / 100).toFixed(2)
```

---

## 🧹 CLEANUP CHECKLIST

### Remove These Files/Functions:
- [ ] Any file with "mock" in the name
- [ ] Test data files with hardcoded prices
- [ ] Temporary price mapping utilities
- [ ] Supabase product enhancement logic
- [ ] Knowledge Bank price calculations
- [ ] Complete the Look hardcoded prices

### Search and Delete These Patterns:
```bash
# Run these searches in your codebase
grep -r "tier_price" src/
grep -r "metadata?.tier_price" src/
grep -r "price.*=.*59.99" src/
grep -r "price.*=.*199" src/
grep -r "hardcoded" src/
```

### Update These Components:
- [ ] ProductCard
- [ ] ProductDetail
- [ ] CartItem
- [ ] CheckoutSummary
- [ ] PriceDisplay
- [ ] Any component showing prices

---

## 🚨 TESTING AFTER BACKEND DEPLOYMENT

### 1. Clear All Caches
```javascript
// Clear localStorage
localStorage.clear()

// Clear sessionStorage
sessionStorage.clear()

// Hard refresh
window.location.reload(true)
```

### 2. Test These Scenarios
- [ ] Product list shows prices (not $0.00)
- [ ] Product detail shows correct price
- [ ] Variant selection updates price
- [ ] Cart shows correct totals
- [ ] No console errors about undefined prices

### 3. Expected Results
- Sand Tuxedo: **$199.99** (not $0.00)
- Black Tuxedo: **$199.99**
- Navy Suit: **$229.99**
- Vendor products: **$179.99-$229.99**

---

## 🛡️ DEFENSIVE PROGRAMMING

### Add Safety Checks:
```javascript
// Safe price extraction
const getPrice = (variant) => {
  try {
    const price = variant?.calculated_price?.calculated_amount
    if (typeof price !== 'number' || price < 0) {
      console.error('Invalid price:', variant)
      return 0
    }
    return price
  } catch (error) {
    console.error('Price extraction failed:', error)
    return 0
  }
}

// Safe formatting
const formatPrice = (cents) => {
  if (!cents || cents === 0) return 'Contact for pricing'
  return `$${(cents / 100).toFixed(2)}`
}
```

---

## 📱 CART IMPLEMENTATION PREP

### If Not Already Implemented:
```javascript
// Minimal cart context setup
const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cartId, setCartId] = useState(null)
  
  useEffect(() => {
    // Get or create cart
    const initCart = async () => {
      let id = localStorage.getItem('cart_id')
      if (!id) {
        const cart = await createCart()
        id = cart.id
        localStorage.setItem('cart_id', id)
      }
      setCartId(id)
    }
    initCart()
  }, [])
  
  const addToCart = async (variantId, quantity = 1) => {
    if (!cartId) return
    
    await fetch(`/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variant_id: variantId,
        quantity
      })
    })
  }
  
  return (
    <CartContext.Provider value={{ cartId, addToCart }}>
      {children}
    </CartContext.Provider>
  )
}
```

---

## ⏰ TIMELINE & PRIORITIES

### NOW (Before Backend Deployment):
1. **Priority 1**: Update pricing utility (15 min)
2. **Priority 2**: Fix product display components (30 min)
3. **Priority 3**: Update API calls with region_id (15 min)
4. **Priority 4**: Remove workarounds (30 min)

### AFTER Backend Deployment:
1. Clear all caches
2. Test price display
3. Verify cart functionality
4. Check checkout flow

---

## 🆘 TROUBLESHOOTING

### If Prices Still Show $0.00:
1. Check browser network tab - is `region_id` included?
2. Check API response - does it have `calculated_price`?
3. Clear cache and hard refresh
4. Check console for errors

### Common Errors and Fixes:
```javascript
// Error: Cannot read property 'calculated_amount' of undefined
// Fix: Add optional chaining
variant?.calculated_price?.calculated_amount || 0

// Error: Price showing as 19999
// Fix: Divide by 100
(price / 100).toFixed(2)

// Error: No prices returned
// Fix: Include region_id in API call
```

---

## ✅ SUCCESS CRITERIA

After backend deployment, you should see:
- [ ] All products showing actual prices (not $0.00)
- [ ] Prices formatted as currency ($199.99)
- [ ] Variant selection maintains correct price
- [ ] Cart calculations are accurate
- [ ] No console errors
- [ ] Page loads in under 3 seconds

---

## 📞 COMMUNICATION

### Before Starting:
Confirm you've read this document and are ready to make changes.

### During Implementation:
Report any blockers or unclear requirements immediately.

### After Deployment:
Confirm all prices are displaying correctly.

---

**IMPORTANT**: These changes are REQUIRED for the system to work. The backend fix is ready to deploy, but frontend MUST be updated first to handle the new data structure.

**Time Required**: ~90 minutes to implement all changes
**Complexity**: Medium (mostly search and replace)
**Risk**: Low (if following this guide exactly)