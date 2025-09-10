# KCT Menswear AI Systems Overview

## 🤖 Current AI Capabilities

### 1. **AI Training Pipeline** (`/src/ai-training/`)
- **Purpose**: Generate embeddings for product recommendations
- **Technology**: OpenAI Embeddings API
- **Features**:
  - Delta-aware training (only processes changed products)
  - Vector database storage (Qdrant/Pinecone)
  - Product hash caching for efficiency
  - Batch processing for API optimization

### 2. **Smart Collection Routing** (`/src/lib/utils/smart-collection-routing.ts`)
- **Purpose**: Intelligent URL-based product filtering
- **Features**:
  - URL parameter preservation
  - Category mapping
  - Smart filter tracking
  - Analytics integration

### 3. **Unified Search Engine** (`/src/lib/services/unifiedSearchEngine.ts`)
- **Purpose**: Combine multiple product sources
- **Features**:
  - Merge Supabase, Core, and Bundle products
  - Apply complex filters
  - AI score integration
  - Faceted search generation

## 🎯 Smart Filtering System

### Current Implementation

#### 1. **Category Filtering**
```typescript
// Case-insensitive category matching
if (filters.category && filters.category.length > 0) {
  const productCategoryLower = product.category.toLowerCase();
  const filterCategoriesLower = filters.category.map(c => c.toLowerCase());
  if (!filterCategoriesLower.includes(productCategoryLower)) return false;
}
```

#### 2. **Multi-field Search**
- Searches across: name, description, category, color, occasions, tags
- Bundle component search (suit/shirt/tie colors)

#### 3. **AI Score Integration**
- Products have `aiScore` field (currently random 80-100)
- Ready for ML-based scoring

## 🚀 Proposed Enhancements

### 1. **Semantic Search with Embeddings**
```typescript
interface SemanticSearchConfig {
  query: string;
  threshold: number; // Similarity threshold (0-1)
  maxResults: number;
  useCache: boolean;
}

async function semanticSearch(config: SemanticSearchConfig): Promise<Product[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(config.query);
  
  // Search vector database
  const results = await vectorStore.search({
    vector: queryEmbedding,
    limit: config.maxResults,
    threshold: config.threshold
  });
  
  return results.map(r => r.payload as Product);
}
```

### 2. **Personalized Recommendations**
```typescript
interface RecommendationEngine {
  getUserPreferences(userId: string): Promise<UserPreferences>;
  getProductSimilarity(productId: string): Promise<Product[]>;
  getOutfitRecommendations(item: Product): Promise<Bundle[]>;
  getTrendingInCategory(category: string): Promise<Product[]>;
}
```

### 3. **Smart Filter Suggestions**
```typescript
interface FilterSuggestion {
  type: 'color' | 'size' | 'occasion' | 'price';
  value: string;
  confidence: number;
  reason: string;
}

async function suggestFilters(
  currentFilters: Filters,
  userHistory: UserHistory
): Promise<FilterSuggestion[]> {
  // Analyze user behavior
  // Suggest relevant filters based on:
  // - Current selection
  // - Past purchases
  // - Trending items
  // - Seasonal relevance
}
```

### 4. **Outfit Builder AI**
```typescript
interface OutfitBuilderAI {
  suggestMatchingItems(baseItem: Product): Promise<{
    shirts: Product[];
    ties: Product[];
    accessories: Product[];
    confidence: number;
  }>;
  
  validateOutfit(items: Product[]): Promise<{
    isValid: boolean;
    score: number;
    suggestions: string[];
  }>;
  
  generateOutfitForOccasion(occasion: string): Promise<Bundle>;
}
```

## 📊 Training Data Requirements

### Product Embeddings Include:
1. **Text Features**:
   - Name, description, category
   - Tags, occasions, materials
   - Color combinations
   
2. **Structured Features**:
   - Price range
   - Seasonality
   - Formality level
   - Style category

3. **User Interaction Features**:
   - View count
   - Purchase frequency
   - Cart additions
   - Return rate

## 🔧 Implementation Plan

### Phase 1: Enhanced Filtering (Week 1)
- [ ] Implement semantic search
- [ ] Add filter suggestions
- [ ] Improve AI scoring

### Phase 2: Personalization (Week 2)
- [ ] User preference learning
- [ ] Browsing history tracking
- [ ] Personalized recommendations

### Phase 3: Outfit Intelligence (Week 3)
- [ ] Outfit builder AI
- [ ] Color coordination rules
- [ ] Occasion-based suggestions

### Phase 4: Advanced Features (Week 4)
- [ ] Visual search (image-based)
- [ ] Trend prediction
- [ ] Dynamic pricing optimization

## 🛠️ Technical Stack

- **Embeddings**: OpenAI text-embedding-3-small
- **Vector DB**: Qdrant/Pinecone (configurable)
- **ML Framework**: TensorFlow.js (client-side)
- **Analytics**: GA4 + Custom events
- **Caching**: Redis/In-memory

## 📈 Metrics to Track

1. **Search Quality**:
   - Click-through rate
   - Conversion rate
   - Zero-result searches
   
2. **Recommendation Performance**:
   - Acceptance rate
   - Cross-sell success
   - Bundle attachment rate

3. **User Engagement**:
   - Filter usage
   - Search refinements
   - Time to purchase

## 🔒 Privacy & Security

- User data anonymization
- Embedding storage encryption
- GDPR compliance
- Opt-in personalization

## 🚦 Current Status

✅ **Working**:
- Basic filtering system
- Category routing
- Product search
- Bundle detection

🚧 **In Progress**:
- AI embeddings generation
- Vector database setup
- Semantic search

📋 **Planned**:
- Personalization engine
- Visual search
- Outfit builder AI
- Trend analysis

## 📝 Next Steps

1. **Immediate**: Run AI training pipeline to generate embeddings
2. **Short-term**: Implement semantic search API endpoint
3. **Medium-term**: Build recommendation engine
4. **Long-term**: Deploy full outfit intelligence system