#!/bin/bash

# Fix price division issues - Medusa 2.0 returns prices in dollars, not cents
echo "Fixing price display issues (removing /100 division)..."

# Files to fix
files=(
  "src/app/kct-shop/page.tsx"
  "src/lib/analytics/analyticsClient.ts"
  "src/app/products/mint-vest/page.tsx"
  "src/app/weddings/video-lookbook/page.tsx"
  "src/lib/email/service.ts"
  "src/app/shop-new/page.tsx"
  "src/app/cart-new/page.tsx"
  "src/app/products-test/page.tsx"
  "src/app/products/dress-shirts/page.tsx"
  "src/app/voice-search/page.tsx"
  "src/app/cart/page.tsx"
  "src/app/shop-medusa/page.tsx"
  "src/app/orders/page.tsx"
  "src/components/style/StyleRecommendations.tsx"
  "src/components/style/EnhancedStyleSwiper.tsx"
  "src/components/style/StyleSwiper.tsx"
  "src/components/wedding/WeddingPartyBuilder.tsx"
  "src/components/ai/AIStyleAssistant.tsx"
  "src/components/admin/AutoTaggingManager.tsx"
  "src/components/recommendations/FashionClipRecommendations.tsx"
  "src/components/video/TimelineMarkers.tsx"
  "src/components/video/VerticalVideoSwiper.tsx"
  "src/components/video/ShoppableVideo.tsx"
  "src/components/search/VisualSearch.tsx"
  "src/components/checkout/CheckoutForm.tsx"
  "src/components/video/ProductHotspot.tsx"
  "src/components/prom/PromHub.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace price / 100 with just price
    sed -i '' 's/price \/ 100/price/g' "$file"
    sed -i '' 's/amount \/ 100/amount/g' "$file"
    sed -i '' 's/total \/ 100/total/g' "$file"
    sed -i '' 's/subtotal \/ 100/subtotal/g' "$file"
    sed -i '' 's/unit_price \/ 100/unit_price/g' "$file"
    sed -i '' 's/discount_total \/ 100/discount_total/g' "$file"
    
    # Also fix any .amount / 100 patterns
    sed -i '' 's/\.amount \/ 100/.amount/g' "$file"
    sed -i '' 's/\.price \/ 100/.price/g' "$file"
    sed -i '' 's/\.total \/ 100/.total/g' "$file"
  else
    echo "File not found: $file"
  fi
done

echo "Price fixes complete!"
echo ""
echo "Summary of changes:"
echo "- Removed division by 100 from all price displays"
echo "- Medusa 2.0 returns prices in dollars, not cents"
echo "- Prices should now display correctly (e.g., $299.00 instead of $2.99)"