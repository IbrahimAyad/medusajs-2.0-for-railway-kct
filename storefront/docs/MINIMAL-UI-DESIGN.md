# Minimal UI Product Card Design System

## Overview
The minimal UI design focuses on image-first product discovery with progressive disclosure. Users interact with products to reveal more information, following the philosophy of "creating clicks by users to find out what they could be interested in."

## Component Architecture

### 1. UltraMinimalProductCard
**Location:** `/src/components/products/UltraMinimalProductCard.tsx`

**Key Features:**
- 90% image coverage - image takes entire card space
- Minimal product info overlay at bottom with gradient
- Integrated expand indicator (Maximize2 icon) on hover/touch
- No separate quick view button - entire card is clickable
- Progressive disclosure - details only on interaction

**Mobile Behavior:**
- Subtle pulsing Plus icon in corner (non-intrusive)
- Touch feedback with expand indicator
- Full card tap opens quick view

**Desktop Behavior:**
- Expand indicator appears on hover
- Smooth scale animation on hover
- Click anywhere opens quick view

### 2. ProductQuickView
**Location:** `/src/components/products/ProductQuickView.tsx`

**Dual-Mode Design:**
- **Mobile:** Bottom sheet with swipe-to-dismiss
- **Desktop:** Side drawer from right

**Key Features:**
- "Almost checkout" design - prominent Add to Cart button
- Product navigation arrows (prev/next)
- Size selector with visual feedback
- Benefits display (shipping, returns, stock)
- Swipe gestures for mobile dismissal
- Escape key closes on desktop

## Grid Layout Standards

### Mobile Grid (Default: 3x3, Optional: 2x2)
```tsx
// 3x3 Grid (Recommended)
<div className="grid grid-cols-3 gap-2">

// 2x2 Grid (Optional for larger product focus)
<div className="grid grid-cols-2 gap-3">
```

### Desktop Grid (4x4)
```tsx
<div className="grid lg:grid-cols-4 gap-4">
```

### Responsive Grid Pattern
```tsx
// Standard implementation
<div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
```

## Spacing Guidelines

### Page Padding
- Mobile: `px-2 py-4`
- Tablet: `px-4 py-6`
- Desktop: `px-4 py-8`

### Grid Gaps
- Mobile: `gap-2` (8px)
- Small screens: `gap-3` (12px)
- Desktop: `gap-4` (16px)

### Card Content Padding
- Mobile: `p-2`
- Larger screens: `p-3`

## Text Sizing

### Product Name
- Mobile: `text-xs`
- Desktop: `text-sm`

### Price
- Mobile: `text-sm`
- Desktop: `text-base`

## Implementation Examples

### Basic Usage
```tsx
import UltraMinimalProductCard from '@/components/products/UltraMinimalProductCard';
import ProductQuickView from '@/components/products/ProductQuickView';

export default function CollectionPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {products.map(product => (
          <UltraMinimalProductCard
            key={product.id}
            product={product}
            onQuickView={handleQuickView}
          />
        ))}
      </div>

      <ProductQuickView
        product={selectedProduct}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        isMobile={isMobile}
      />
    </>
  );
}
```

### With 2x2 Mobile Option
```tsx
// Add a prop to control grid density
interface CollectionProps {
  mobileGrid?: '2x2' | '3x3';
}

// Use conditional classes
<div className={cn(
  "grid gap-2 sm:gap-3 md:gap-4",
  mobileGrid === '2x2' ? "grid-cols-2" : "grid-cols-3",
  "lg:grid-cols-4"
)}>
```

## Design Principles

1. **Image First:** Product image is the primary focus (90% of card)
2. **Minimal Text:** Only essential info (name + price) visible initially
3. **Progressive Disclosure:** Details revealed through interaction
4. **Touch Optimized:** Large tap targets, swipe gestures
5. **Fast Actions:** "Almost checkout" quick view for conversion
6. **Consistent Spacing:** Uniform gaps and padding across all views

## Color & Style

- **Text on Image:** White text with gradient backdrop for readability
- **Gradient:** `from-black/60 via-black/20 to-transparent`
- **Indicators:** White with backdrop blur for visibility
- **Out of Stock:** Black/40 overlay with white text badge

## Animation Guidelines

- **Hover Scale:** 1.02 (subtle growth)
- **Tap Scale:** 0.98 (tactile feedback)
- **Image Zoom:** 1.10 scale on hover/touch
- **Transitions:** 300-700ms with ease timing
- **Spring Animations:** damping: 30, stiffness: 300

## Future Enhancements

- **AI Recommendations:** Colored borders to indicate AI suggestions
- **Comparison Mode:** Select multiple products to compare
- **Haptic Feedback:** Mobile vibration on interactions
- **Gesture Navigation:** Swipe between products in grid
- **Virtual Try-On:** AR integration for applicable products

## Migration Checklist

When updating existing product cards to minimal UI:

- [ ] Replace existing ProductCard with UltraMinimalProductCard
- [ ] Add ProductQuickView component
- [ ] Update grid to 3x3 mobile / 4x4 desktop
- [ ] Adjust spacing to match guidelines
- [ ] Test mobile swipe gestures
- [ ] Verify quick view navigation
- [ ] Check responsive breakpoints
- [ ] Ensure consistent padding/gaps

## Browser Support

- **Desktop:** Chrome, Safari, Firefox, Edge (latest 2 versions)
- **Mobile:** iOS Safari 14+, Chrome Mobile, Samsung Internet
- **Features:** CSS Grid, Flexbox, Touch Events, Pointer Events

---

Last Updated: 2025-08-14
Status: Active Implementation