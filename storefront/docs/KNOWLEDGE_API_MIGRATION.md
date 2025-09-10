# Knowledge API Migration Guide

## How to Update API Connection Configuration

### 1. Environment Variables
No changes needed - your current environment variables are correct:
```env
NEXT_PUBLIC_KNOWLEDGE_BANK_API=https://kct-knowledge-api-production.up.railway.app
NEXT_PUBLIC_KNOWLEDGE_BANK_KEY=kct-menswear-api-2024-secret
```

### 2. Import the Enhanced Adapter

Replace the old adapter imports with the new enhanced version:

```typescript
// OLD
import { knowledgeBankAdapter } from '@/lib/services/knowledgeBankAdapter';

// NEW
import { enhancedKnowledgeAPI } from '@/lib/services/enhancedKnowledgeAdapter';
```

### 3. Update Method Calls

The enhanced adapter includes all V1 methods plus new V2 features:

#### Visual Analysis (NEW)
```typescript
// Analyze an uploaded image
const analysis = await enhancedKnowledgeAPI.analyzeImage(imageUrl);

// Find visually similar products
const matches = await enhancedKnowledgeAPI.findVisualMatches(imageUrl);

// Search by image
const results = await enhancedKnowledgeAPI.searchByImage(imageUrl);
```

#### Smart Bundles (NEW)
```typescript
// Generate AI-powered bundles
const bundles = await enhancedKnowledgeAPI.generateSmartBundle({
  occasion: 'wedding',
  season: 'summer',
  budget: { min: 500, max: 1000 }
});

// Get trending bundles
const trending = await enhancedKnowledgeAPI.getTrendingBundles(10);

// Optimize a bundle for conversion
const optimized = await enhancedKnowledgeAPI.optimizeBundle(itemIds);
```

#### Analytics & Intelligence (NEW)
```typescript
// Get conversion analytics
const analytics = await enhancedKnowledgeAPI.getConversionAnalytics();

// Get customer insights
const insights = await enhancedKnowledgeAPI.getCustomerInsights(customerId);

// Get trend predictions
const predictions = await enhancedKnowledgeAPI.getTrendPredictions();

// Get market intelligence
const market = await enhancedKnowledgeAPI.getMarketIntelligence();
```

#### Core Features (EXISTING - Same API)
```typescript
// These work the same as before
const colors = await enhancedKnowledgeAPI.getColorRelationships('navy');
const validation = await enhancedKnowledgeAPI.validateCombination(suit, shirt, tie);
const recommendations = await enhancedKnowledgeAPI.getRecommendations(options);
const trending = await enhancedKnowledgeAPI.getTrending();
```

### 4. Feature Flags

All features are enabled by default. To disable specific features, modify `/lib/config/knowledgeApi.ts`:

```typescript
features: {
  fashionClip: true,        // Visual analysis
  smartBundles: true,       // AI bundles
  conversionAnalytics: true,
  customerProfiling: true,
  predictiveTrends: true,
  marketIntelligence: true,
  visualSearch: true,
  realTimeAnalytics: true,
}
```

### 5. Quick Integration Examples

#### Add Visual Search to Product Page
```typescript
// In your product page component
import { enhancedKnowledgeAPI } from '@/lib/services/enhancedKnowledgeAdapter';

const handleImageUpload = async (file: File) => {
  const imageUrl = URL.createObjectURL(file);
  const analysis = await enhancedKnowledgeAPI.analyzeImage(imageUrl);
  
  // Show matching products
  const matches = await enhancedKnowledgeAPI.findVisualMatches(imageUrl);
  setRecommendedProducts(matches);
};
```

#### Add Smart Bundles to Homepage
```typescript
// In your homepage component
import { enhancedKnowledgeAPI } from '@/lib/services/enhancedKnowledgeAdapter';

useEffect(() => {
  const loadBundles = async () => {
    const bundles = await enhancedKnowledgeAPI.getTrendingBundles(6);
    setFeaturedBundles(bundles);
  };
  loadBundles();
}, []);
```

#### Add Conversion Badge to Products
```typescript
// In your product card component
const analytics = await enhancedKnowledgeAPI.getConversionAnalytics();
const conversionRate = analytics.products[productId]?.conversionRate;

if (conversionRate > 20) {
  return <Badge>High Converting - {conversionRate}%</Badge>;
}
```

### 6. Performance Benefits

The enhanced adapter includes:
- **Smart Caching**: Different TTLs for different data types
- **Request Deduplication**: Prevents duplicate in-flight requests
- **Automatic Retries**: With exponential backoff
- **Circuit Breaker**: Prevents cascading failures
- **Optimized Responses**: Compressed and cached

### 7. Testing the Integration

Test endpoint to verify everything works:
```typescript
// pages/api/test-enhanced-knowledge.ts
import { enhancedKnowledgeAPI } from '@/lib/services/enhancedKnowledgeAdapter';

export default async function handler(req, res) {
  try {
    const health = await enhancedKnowledgeAPI.checkHealth();
    const trending = await enhancedKnowledgeAPI.getTrendingBundles(3);
    
    res.status(200).json({
      status: 'success',
      apiHealth: health,
      sampleBundles: trending,
      features: {
        visualAnalysis: true,
        smartBundles: true,
        analytics: true,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 8. Gradual Migration

You can use both adapters during migration:
```typescript
import { knowledgeBankAdapter } from '@/lib/services/knowledgeBankAdapter'; // Old
import { enhancedKnowledgeAPI } from '@/lib/services/enhancedKnowledgeAdapter'; // New

// Use old for existing features
const colors = await knowledgeBankAdapter.getColorRelationships('navy');

// Use new for enhanced features
const bundles = await enhancedKnowledgeAPI.generateSmartBundle({ occasion: 'wedding' });
```

## Next Steps

1. Start with quick wins - add trending bundles to homepage
2. Implement visual search on product pages  
3. Add conversion badges to high-performing products
4. Build AI shopping assistant using customer insights
5. Create trending dashboard for inventory decisions