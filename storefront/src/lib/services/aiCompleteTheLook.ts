/**
 * AI-Powered Complete the Look Service
 * Combines Fashion CLIP visual analysis with smart caching for optimal performance
 */

import { fetchMedusaProducts, type MedusaProduct } from '@/services/medusaBackendService'
import { getProductPrice } from '@/utils/pricing'
import { medusaProductCache } from '@/services/medusaProductCache'
import { 
  getStaticSuggestions, 
  colorHarmonyRules, 
  formalityLevels,
  type OutfitMapping 
} from '@/lib/ai/complete-look-mappings'
import { KnowledgeBankAdapter } from '@/lib/services/knowledgeBankAdapter'
import { 
  buildProductPayload, 
  buildCompleteTheLookPayload,
  safeSlice,
  safeMap
} from '@/lib/services/knowledgeBankUtils'

export interface AISuggestion {
  id: string
  handle?: string
  title: string
  price: number
  image: string
  category: string
  confidence: number
  reason: string
  visualMatch?: number
  isAiEnhanced?: boolean
}

interface FashionClipAnalysis {
  embeddings?: number[]
  style?: string
  formality?: number
  color_palette?: string[]
  category?: string
  attributes?: string[]
}

class AICompleteTheLookService {
  private fashionClipUrl: string
  private fashionClipKey: string
  private knowledgeApiUrl: string
  private knowledgeApiKey: string
  private knowledgeBank: KnowledgeBankAdapter
  private cacheTimeout: number = 30 * 60 * 1000 // 30 minutes

  constructor() {
    this.fashionClipUrl = process.env.NEXT_PUBLIC_FASHION_CLIP_API || 'https://fashion-clip-kct-production.up.railway.app'
    this.fashionClipKey = process.env.NEXT_PUBLIC_FASHION_CLIP_KEY || 'kct-menswear-api-2024-secret'
    this.knowledgeApiUrl = process.env.KCT_KNOWLEDGE_API_URL || 'https://kct-knowledge-api-2-production.up.railway.app'
    this.knowledgeApiKey = process.env.KCT_KNOWLEDGE_API_KEY || 'kct-menswear-api-2024-secret'
    this.knowledgeBank = new KnowledgeBankAdapter()
  }

  /**
   * Get AI-powered suggestions with 3-tier approach
   * 1. Instant static suggestions
   * 2. Cached AI suggestions
   * 3. Real-time AI analysis
   */
  async getSuggestions(
    product: MedusaProduct, 
    options: {
      useCache?: boolean
      useAI?: boolean
      limit?: number
    } = {}
  ): Promise<AISuggestion[]> {
    const { useCache = true, useAI = true, limit = 4 } = options
    
    // Defensive: Ensure limit is a valid number
    const safeLimit = Number.isFinite(limit) ? limit : 4

    // Tier 1: Get instant static suggestions
    const staticSuggestions = await this.getStaticSuggestionsWithProducts(product, safeLimit)
    
    if (!useAI) {
      return staticSuggestions
    }

    // Tier 2: Check cache for AI suggestions
    if (useCache) {
      const cached = this.getCachedSuggestions(product.id)
      if (cached) {
        return cached
      }
    }

    // Tier 3: Generate AI suggestions (progressive enhancement)
    try {
      const aiSuggestions = await this.generateAISuggestions(product, safeLimit)
      
      // Cache the results
      if (useCache) {
        this.cacheSuggestions(product.id, aiSuggestions)
      }
      
      return aiSuggestions
    } catch (error) {
      console.error('AI suggestion generation failed, falling back to static:', error)
      return staticSuggestions
    }
  }

  /**
   * Get static suggestions with real product data
   */
  private async getStaticSuggestionsWithProducts(
    product: MedusaProduct,
    limit: number
  ): Promise<AISuggestion[]> {
    const staticMapping = getStaticSuggestions(product.title)
    if (!staticMapping) return []

    try {
      // Fetch real products from Medusa - FIX: Pass number, not object
      const products = await fetchMedusaProducts(50)
      
      // Defensive: Ensure products is an array
      if (!Array.isArray(products)) {
        console.warn('Products is not an array, falling back')
        return this.createFallbackSuggestions(staticMapping, limit)
      }
      
      const suggestions: AISuggestion[] = []

      // Map static suggestions to real products
      const allSuggestionIds = [
        ...(staticMapping.suggestions.shirts || []),
        ...(staticMapping.suggestions.ties || []),
        ...(staticMapping.suggestions.shoes || []),
        ...(staticMapping.suggestions.accessories || [])
      ]

      // FIX: Use safe slice utility
      for (const suggestionId of safeSlice(allSuggestionIds, 0, limit)) {
        // Find matching product by handle or title keywords
        const matchingProduct = products?.find(p => {
          const handle = p.handle?.toLowerCase()
          const title = p.title?.toLowerCase()
          const suggestion = suggestionId.toLowerCase().replace(/-/g, ' ')
          
          return handle?.includes(suggestion) || 
                 title?.includes(suggestion) ||
                 this.fuzzyMatch(title, suggestion)
        })

        if (matchingProduct && matchingProduct.id !== product.id) {
          suggestions.push({
            id: matchingProduct.id,
            handle: matchingProduct.handle,
            title: matchingProduct.title,
            price: getProductPrice(matchingProduct) || 99,
            image: matchingProduct.thumbnail || matchingProduct.images?.[0]?.url || this.getFallbackImage(suggestionId),
            category: this.detectCategory(matchingProduct.title),
            confidence: 0.7, // Static suggestions have lower confidence
            reason: 'Classic pairing',
            isAiEnhanced: false
          })
        }
      }

      // If we don't have enough real products, add fallback suggestions
      while (suggestions.length < limit) {
        const fallback = this.createFallbackSuggestion(allSuggestionIds[suggestions.length])
        if (fallback) suggestions.push(fallback)
        else break
      }

      return suggestions
    } catch (error) {
      console.error('Failed to fetch products for static suggestions:', error)
      return this.createFallbackSuggestions(staticMapping || this.getDefaultMapping(), limit)
    }
  }

  /**
   * Generate AI-powered suggestions using Fashion CLIP
   */
  private async generateAISuggestions(
    product: MedusaProduct,
    limit: number
  ): Promise<AISuggestion[]> {
    try {
      // Step 1: Analyze product with Fashion CLIP
      const analysis = await this.analyzeProductWithFashionClip(product)
      
      // Step 2: Get complementary products using visual AI
      const complementaryProducts = await this.findComplementaryProducts(product, analysis, limit * 2)
      
      // Step 3: Apply style rules and filtering
      const filtered = this.applyStyleRules(product, complementaryProducts, analysis)
      
      // Step 4: Rank and limit results
      const ranked = this.rankSuggestions(filtered, analysis)
      
      // FIX: Add defensive check for ranked array
      return Array.isArray(ranked) ? ranked.slice(0, limit) : []
    } catch (error) {
      console.error('AI suggestion generation error:', error)
      throw error
    }
  }

  /**
   * Analyze product using Knowledge Bank API instead of Fashion CLIP
   */
  private async analyzeProductWithFashionClip(product: MedusaProduct): Promise<FashionClipAnalysis> {
    try {
      // Use Knowledge Bank for analysis - it's more reliable
      const suitColor = this.extractColors(product.title)[0] || 'navy'
      const recommendations = await this.knowledgeBank.getRecommendations({
        occasion: this.detectOccasion(product.title),
        season: this.getCurrentSeason()
      })
      
      // FIX: Add defensive check for recommendations array
      const safeRecommendations = Array.isArray(recommendations) ? recommendations : []
      
      // Convert Knowledge Bank response to FashionClipAnalysis format
      return {
        category: this.detectCategory(product.title),
        formality: this.detectFormality(product.title),
        color_palette: this.extractColors(product.title),
        style: this.detectStyle(product.title),
        // FIX: Use safe utilities for array operations
        attributes: safeMap(safeSlice(safeRecommendations, 0, 3), r => r?.reason || '')
      }
    } catch (error) {
      console.error('Knowledge Bank analysis failed, using text analysis:', error)
      return this.analyzeProductFromText(product)
    }
  }

  /**
   * Text-based analysis fallback
   */
  private analyzeProductFromText(product: MedusaProduct): FashionClipAnalysis {
    const title = product.title.toLowerCase()
    const description = (product.description || '').toLowerCase()
    
    // Detect style attributes from text
    const analysis: FashionClipAnalysis = {
      category: this.detectCategory(title),
      formality: this.detectFormality(title + ' ' + description),
      color_palette: this.extractColors(title + ' ' + description),
      style: this.detectStyle(title + ' ' + description),
      attributes: []
    }

    return analysis
  }

  /**
   * Find complementary products using AI analysis
   */
  private async findComplementaryProducts(
    baseProduct: MedusaProduct,
    analysis: FashionClipAnalysis,
    limit: number
  ): Promise<AISuggestion[]> {
    try {
      // Fetch all available products - FIX: Pass number, not object
      const products = await fetchMedusaProducts(100)
      
      // Defensive: Ensure products is an array
      if (!Array.isArray(products)) {
        console.warn('Products is not an array in findComplementaryProducts')
        return []
      }
      
      // Score each product for complementarity
      const scored = products
        .filter(p => p.id !== baseProduct.id)
        .map(p => ({
          product: p,
          score: this.calculateComplementarityScore(baseProduct, p, analysis)
        }))
        .sort((a, b) => b.score.total - a.score.total)
        .slice(0, limit)

      // Convert to suggestions
      return scored.map(({ product, score }) => ({
        id: product.id,
        handle: product.handle,
        title: product.title,
        price: getProductPrice(product) || 99,
        image: product.thumbnail || product.images?.[0]?.url || '',
        category: this.detectCategory(product.title),
        confidence: score.total,
        reason: score.reason,
        visualMatch: score.visual,
        isAiEnhanced: true
      }))
    } catch (error) {
      console.error('Failed to find complementary products:', error)
      return []
    }
  }

  /**
   * Calculate how well two products complement each other
   */
  private calculateComplementarityScore(
    base: MedusaProduct,
    candidate: MedusaProduct,
    analysis: FashionClipAnalysis
  ): { total: number; visual: number; style: number; reason: string } {
    let score = 0
    let visual = 0
    let style = 0
    let reasons = []

    const baseCategory = this.detectCategory(base.title)
    const candidateCategory = this.detectCategory(candidate.title)

    // Category complementarity (suit needs shirt, tie, shoes)
    if (this.areCategoriesComplementary(baseCategory, candidateCategory)) {
      score += 0.3
      reasons.push('Complementary category')
    }

    // Color harmony
    const baseColors = analysis.color_palette || this.extractColors(base.title)
    const candidateColors = this.extractColors(candidate.title)
    const colorScore = this.calculateColorHarmony(baseColors, candidateColors)
    score += colorScore * 0.3
    visual += colorScore
    if (colorScore > 0.7) reasons.push('Color harmony')

    // Formality matching
    const baseFormality = analysis.formality || this.detectFormality(base.title)
    const candidateFormality = this.detectFormality(candidate.title)
    if (Math.abs(baseFormality - candidateFormality) < 2) {
      score += 0.2
      style += 0.5
      reasons.push('Matching formality')
    }

    // Style consistency
    const baseStyle = analysis.style || this.detectStyle(base.title)
    const candidateStyle = this.detectStyle(candidate.title)
    if (baseStyle === candidateStyle) {
      score += 0.2
      style += 0.5
      reasons.push('Consistent style')
    }

    return {
      total: Math.min(score, 1),
      visual,
      style,
      reason: reasons.join(', ') || 'Good match'
    }
  }

  /**
   * Apply style rules to filter suggestions
   */
  private applyStyleRules(
    product: MedusaProduct,
    suggestions: AISuggestion[],
    analysis: FashionClipAnalysis
  ): AISuggestion[] {
    const baseColor = analysis.color_palette?.[0] || this.extractColors(product.title)[0]
    const rules = colorHarmonyRules[baseColor as keyof typeof colorHarmonyRules]

    if (!rules) return suggestions

    return suggestions.filter(suggestion => {
      const suggestionColors = this.extractColors(suggestion.title)
      
      // Check if suggestion colors are in avoid list
      for (const color of suggestionColors) {
        if (rules.avoid?.some(avoid => color.includes(avoid))) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * Rank suggestions by relevance
   */
  private rankSuggestions(
    suggestions: AISuggestion[],
    analysis: FashionClipAnalysis
  ): AISuggestion[] {
    // Ensure variety in categories
    const categorized = new Map<string, AISuggestion[]>()
    
    for (const suggestion of suggestions) {
      const category = suggestion.category
      if (!categorized.has(category)) {
        categorized.set(category, [])
      }
      categorized.get(category)!.push(suggestion)
    }

    // Take top item from each category
    const ranked: AISuggestion[] = []
    const categories = Array.from(categorized.keys())
    
    // Prioritize essential categories
    const priorityOrder = ['shirt', 'tie', 'shoes', 'accessory', 'vest', 'outerwear']
    categories.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a)
      const bIndex = priorityOrder.indexOf(b)
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })

    for (const category of categories) {
      const items = categorized.get(category)!
      ranked.push(items[0]) // Take best from each category
    }

    return ranked
  }

  // Helper methods

  private detectCategory(title: string): string {
    const lower = title.toLowerCase()
    if (lower.includes('suit') || lower.includes('tuxedo')) return 'suit'
    if (lower.includes('shirt')) return 'shirt'
    if (lower.includes('tie') && !lower.includes('bowtie')) return 'tie'
    if (lower.includes('bowtie') || lower.includes('bow tie')) return 'bowtie'
    if (lower.includes('shoe') || lower.includes('oxford') || lower.includes('loafer')) return 'shoes'
    if (lower.includes('vest') || lower.includes('waistcoat')) return 'vest'
    if (lower.includes('blazer') || lower.includes('jacket')) return 'blazer'
    if (lower.includes('pocket') || lower.includes('cufflink') || lower.includes('belt')) return 'accessory'
    return 'other'
  }

  private detectFormality(text: string): number {
    const lower = text.toLowerCase()
    if (lower.includes('tuxedo') || lower.includes('black tie')) return 10
    if (lower.includes('formal') || lower.includes('wedding')) return 9
    if (lower.includes('suit') || lower.includes('business')) return 7
    if (lower.includes('blazer') || lower.includes('sport coat')) return 5
    if (lower.includes('casual') || lower.includes('polo')) return 3
    return 5 // Default middle formality
  }

  private detectStyle(text: string): string {
    const lower = text.toLowerCase()
    if (lower.includes('modern') || lower.includes('slim')) return 'modern'
    if (lower.includes('classic') || lower.includes('traditional')) return 'classic'
    if (lower.includes('trendy') || lower.includes('fashion')) return 'trendy'
    if (lower.includes('vintage') || lower.includes('retro')) return 'vintage'
    return 'versatile'
  }

  private extractColors(text: string): string[] {
    const lower = text.toLowerCase()
    const colors = []
    
    const colorKeywords = [
      'navy', 'blue', 'charcoal', 'grey', 'gray', 'black', 'white',
      'brown', 'tan', 'beige', 'burgundy', 'red', 'pink', 'purple',
      'green', 'silver', 'gold', 'cream', 'ivory'
    ]
    
    for (const color of colorKeywords) {
      if (lower.includes(color)) {
        colors.push(color)
      }
    }
    
    return colors.length > 0 ? colors : ['neutral']
  }

  private calculateColorHarmony(colors1: string[], colors2: string[]): number {
    // Simplified color harmony calculation
    for (const c1 of colors1) {
      for (const c2 of colors2) {
        const rules = colorHarmonyRules[c1 as keyof typeof colorHarmonyRules]
        if (rules?.complementary?.includes(c2)) {
          return 0.9
        }
        if (rules?.avoid?.includes(c2)) {
          return 0.1
        }
      }
    }
    return 0.5 // Neutral
  }

  private areCategoriesComplementary(cat1: string, cat2: string): boolean {
    const complementaryPairs = {
      'suit': ['shirt', 'tie', 'shoes', 'accessory'],
      'shirt': ['tie', 'vest', 'blazer', 'accessory'],
      'blazer': ['shirt', 'tie', 'shoes'],
      'tie': ['shirt', 'accessory'],
      'shoes': ['belt', 'socks']
    }
    
    return complementaryPairs[cat1 as keyof typeof complementaryPairs]?.includes(cat2) || false
  }

  private fuzzyMatch(str1: string, str2: string): boolean {
    // Simple fuzzy matching
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    
    for (const w1 of words1) {
      for (const w2 of words2) {
        if (w1.includes(w2) || w2.includes(w1)) {
          return true
        }
      }
    }
    return false
  }

  private getFallbackImage(suggestionId: string): string {
    const imageMap: Record<string, string> = {
      'white-dress-shirt': 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/dd5c1f7d-722d-4e17-00be-60a3fdb33900/public',
      'tie': 'https://cdn.kctmenswear.com/main-solid-vest-tie/navy-tie.png',
      'shoes': 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
      'pocket-square': 'https://cdn.kctmenswear.com/accessories/pocket-squares/white-pocket-square.png'
    }
    
    for (const [key, url] of Object.entries(imageMap)) {
      if (suggestionId.includes(key)) {
        return url
      }
    }
    
    return 'https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=Product'
  }

  private createFallbackSuggestion(suggestionId: string): AISuggestion | null {
    if (!suggestionId) return null
    
    return {
      id: `fallback-${suggestionId}`,
      handle: suggestionId,
      title: suggestionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      price: 99,
      image: this.getFallbackImage(suggestionId),
      category: this.detectCategory(suggestionId),
      confidence: 0.5,
      reason: 'Classic recommendation',
      isAiEnhanced: false
    }
  }

  private getDefaultMapping(): OutfitMapping {
    return {
      category: 'general',
      keywords: [],
      suggestions: {
        shirts: ['white-dress-shirt', 'light-blue-dress-shirt'],
        ties: ['silk-tie', 'navy-tie'],
        shoes: ['dress-shoes', 'oxford-shoes'],
        accessories: ['pocket-square', 'cufflinks']
      }
    }
  }
  
  private getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }
  
  private detectOccasion(title: string): string {
    const lower = title.toLowerCase()
    if (lower.includes('wedding')) return 'wedding'
    if (lower.includes('tuxedo') || lower.includes('formal')) return 'formal'
    if (lower.includes('business')) return 'business'
    if (lower.includes('casual')) return 'casual'
    return 'versatile'
  }
  
  private createFallbackSuggestions(mapping: OutfitMapping, limit: number): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    const allSuggestions = [
      ...(mapping.suggestions.shirts || []),
      ...(mapping.suggestions.ties || []),
      ...(mapping.suggestions.shoes || []),
      ...(mapping.suggestions.accessories || [])
    ]

    // FIX: Use safe slice utility
    for (const id of safeSlice(allSuggestions, 0, limit)) {
      const suggestion = this.createFallbackSuggestion(id)
      if (suggestion) suggestions.push(suggestion)
    }

    return suggestions
  }

  // Multi-tier Cache Management
  private memoryCache: Map<string, { suggestions: AISuggestion[], timestamp: number }> = new Map()

  private getCachedSuggestions(productId: string): AISuggestion[] | null {
    if (typeof window === 'undefined') return null
    
    // Tier 1: Memory cache (instant)
    const memCached = this.memoryCache.get(productId)
    if (memCached && Date.now() - memCached.timestamp < this.cacheTimeout) {
      console.log('[CACHE] Memory cache hit')
      return memCached.suggestions
    }
    
    // Tier 2: SessionStorage (same session)
    try {
      const sessionCached = sessionStorage.getItem(`ai-suggestions-${productId}`)
      if (sessionCached) {
        const { suggestions, timestamp } = JSON.parse(sessionCached)
        if (Date.now() - timestamp < this.cacheTimeout) {
          console.log('[CACHE] Session cache hit')
          // Promote to memory cache
          this.memoryCache.set(productId, { suggestions, timestamp })
          return suggestions
        }
      }
    } catch {}
    
    // Tier 3: LocalStorage (persistent)
    try {
      const localCached = localStorage.getItem(`ai-suggestions-${productId}`)
      if (localCached) {
        const { suggestions, timestamp } = JSON.parse(localCached)
        if (Date.now() - timestamp > this.cacheTimeout) {
          localStorage.removeItem(`ai-suggestions-${productId}`)
          return null
        }
        console.log('[CACHE] Local cache hit')
        // Promote to faster caches
        this.memoryCache.set(productId, { suggestions, timestamp })
        sessionStorage.setItem(`ai-suggestions-${productId}`, localCached)
        return suggestions
      }
    } catch {}
    
    return null
  }

  private cacheSuggestions(productId: string, suggestions: AISuggestion[]): void {
    if (typeof window === 'undefined') return
    
    const cacheData = JSON.stringify({
      suggestions,
      timestamp: Date.now()
    })
    
    // Write to all cache tiers
    try {
      // Memory cache
      this.memoryCache.set(productId, { suggestions, timestamp: Date.now() })
      
      // SessionStorage
      sessionStorage.setItem(`ai-suggestions-${productId}`, cacheData)
      
      // LocalStorage with size check
      if (cacheData.length < 50000) { // Limit to 50KB per item
        localStorage.setItem(`ai-suggestions-${productId}`, cacheData)
      }
    } catch (error) {
      console.warn('Cache write failed:', error)
      // Clean up old cache entries if storage is full
      this.cleanupCache()
    }
  }
  
  private cleanupCache(): void {
    if (typeof window === 'undefined') return
    
    try {
      // Clean old entries from localStorage
      const keys = Object.keys(localStorage)
      const aiKeys = keys.filter(k => k.startsWith('ai-suggestions-'))
      
      // Remove entries older than cache timeout
      aiKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const { timestamp } = JSON.parse(data)
            if (Date.now() - timestamp > this.cacheTimeout) {
              localStorage.removeItem(key)
            }
          }
        } catch {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Cache cleanup failed:', error)
    }
  }
}

// Export singleton instance
export const aiCompleteTheLookService = new AICompleteTheLookService()