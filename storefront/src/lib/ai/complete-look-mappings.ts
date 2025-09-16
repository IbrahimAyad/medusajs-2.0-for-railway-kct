/**
 * Static Complete the Look Mappings
 * Pre-computed outfit combinations for instant display (0ms load time)
 * These are curated by style experts and validated by AI
 */

export interface OutfitMapping {
  category: string
  keywords: string[]
  suggestions: {
    shirts?: string[]
    ties?: string[]
    shoes?: string[]
    accessories?: string[]
    vests?: string[]
    outerwear?: string[]
  }
}

// Pre-computed outfit combinations based on product categories
export const staticOutfitMappings: Record<string, OutfitMapping> = {
  // Navy Suits
  'navy-suit': {
    category: 'suit',
    keywords: ['navy', 'blue', 'suit', 'two-piece', 'three-piece'],
    suggestions: {
      shirts: ['white-dress-shirt', 'light-blue-dress-shirt', 'pink-dress-shirt'],
      ties: ['burgundy-tie', 'silver-tie', 'navy-pattern-tie', 'red-tie'],
      shoes: ['black-oxford-shoes', 'dark-brown-dress-shoes'],
      accessories: ['white-pocket-square', 'silver-cufflinks', 'black-belt']
    }
  },
  
  // Charcoal/Grey Suits
  'charcoal-suit': {
    category: 'suit',
    keywords: ['charcoal', 'grey', 'gray', 'suit'],
    suggestions: {
      shirts: ['white-dress-shirt', 'light-blue-dress-shirt', 'lavender-dress-shirt'],
      ties: ['burgundy-tie', 'navy-tie', 'silver-tie', 'purple-tie'],
      shoes: ['black-oxford-shoes', 'burgundy-dress-shoes'],
      accessories: ['white-pocket-square', 'silver-cufflinks', 'black-belt']
    }
  },
  
  // Black Suits/Tuxedos
  'black-suit': {
    category: 'suit',
    keywords: ['black', 'suit', 'tuxedo', 'formal'],
    suggestions: {
      shirts: ['white-dress-shirt', 'white-tuxedo-shirt'],
      ties: ['black-bow-tie', 'black-tie', 'silver-tie'],
      shoes: ['black-patent-shoes', 'black-oxford-shoes'],
      accessories: ['white-pocket-square', 'silver-cufflinks', 'cummerbund', 'studs']
    }
  },
  
  // Brown/Tan Suits
  'brown-suit': {
    category: 'suit',
    keywords: ['brown', 'tan', 'beige', 'khaki', 'suit'],
    suggestions: {
      shirts: ['white-dress-shirt', 'light-blue-dress-shirt', 'cream-dress-shirt'],
      ties: ['brown-tie', 'burgundy-tie', 'orange-tie', 'green-tie'],
      shoes: ['brown-oxford-shoes', 'tan-dress-shoes'],
      accessories: ['brown-pocket-square', 'gold-cufflinks', 'brown-belt']
    }
  },
  
  // Wedding Collection
  'wedding-suit': {
    category: 'wedding',
    keywords: ['wedding', 'groom', 'groomsmen', 'formal'],
    suggestions: {
      shirts: ['white-dress-shirt', 'ivory-dress-shirt'],
      ties: ['silver-tie', 'blush-tie', 'champagne-tie', 'navy-tie'],
      shoes: ['black-oxford-shoes', 'brown-dress-shoes'],
      accessories: ['white-pocket-square', 'boutonniere-pin', 'cufflinks', 'suspenders'],
      vests: ['matching-vest', 'silver-vest']
    }
  },
  
  // Prom/Event Suits
  'prom-suit': {
    category: 'prom',
    keywords: ['prom', 'event', 'party', 'cocktail'],
    suggestions: {
      shirts: ['white-dress-shirt', 'black-dress-shirt'],
      ties: ['bow-tie', 'skinny-tie', 'pattern-tie'],
      shoes: ['black-dress-shoes', 'velvet-loafers'],
      accessories: ['pocket-square', 'lapel-pin', 'cufflinks'],
      vests: ['patterned-vest', 'velvet-vest']
    }
  },
  
  // Dress Shirts (when shirt is the main item)
  'dress-shirt': {
    category: 'shirt',
    keywords: ['shirt', 'dress shirt', 'button'],
    suggestions: {
      ties: ['silk-tie', 'knit-tie', 'skinny-tie'],
      accessories: ['cufflinks', 'collar-stays', 'tie-clip'],
      vests: ['sweater-vest', 'suit-vest'],
      outerwear: ['blazer', 'sport-coat']
    }
  },
  
  // Blazers/Sport Coats
  'blazer': {
    category: 'blazer',
    keywords: ['blazer', 'sport coat', 'jacket'],
    suggestions: {
      shirts: ['dress-shirt', 'casual-shirt', 'polo'],
      ties: ['knit-tie', 'casual-tie'],
      shoes: ['loafers', 'dress-shoes', 'chelsea-boots'],
      accessories: ['pocket-square', 'lapel-pin', 'belt']
    }
  }
}

/**
 * Get static suggestions based on product title/category
 * Returns instant suggestions while AI loads
 */
export function getStaticSuggestions(productTitle: string): OutfitMapping | null {
  const lowerTitle = productTitle.toLowerCase()
  
  // Find best matching category
  for (const [key, mapping] of Object.entries(staticOutfitMappings)) {
    // Check if any keyword matches
    if (mapping.keywords.some(keyword => lowerTitle.includes(keyword))) {
      return mapping
    }
  }
  
  // Default fallback
  return {
    category: 'general',
    keywords: [],
    suggestions: {
      shirts: ['white-dress-shirt'],
      ties: ['silk-tie'],
      shoes: ['dress-shoes'],
      accessories: ['pocket-square', 'cufflinks']
    }
  }
}

/**
 * Color harmony rules for AI validation
 */
export const colorHarmonyRules = {
  navy: {
    complementary: ['burgundy', 'pink', 'white', 'light-blue', 'silver'],
    avoid: ['black-tie', 'navy-tie']
  },
  charcoal: {
    complementary: ['white', 'light-blue', 'purple', 'burgundy', 'pink'],
    avoid: ['grey-tie']
  },
  black: {
    complementary: ['white', 'silver', 'red', 'gold'],
    avoid: ['brown', 'tan']
  },
  brown: {
    complementary: ['white', 'cream', 'light-blue', 'orange', 'green'],
    avoid: ['black', 'grey']
  },
  grey: {
    complementary: ['white', 'pink', 'light-blue', 'burgundy', 'navy'],
    avoid: ['grey-tie']
  }
}

/**
 * Formality levels for matching
 */
export const formalityLevels = {
  'ultra-formal': ['tuxedo', 'white-tie', 'black-tie'],
  'formal': ['suit', 'dress-shirt', 'dress-shoes', 'tie'],
  'business': ['suit', 'blazer', 'dress-shirt', 'oxford-shoes'],
  'business-casual': ['blazer', 'sport-coat', 'dress-shirt', 'loafers'],
  'smart-casual': ['blazer', 'shirt', 'chinos', 'loafers'],
  'casual': ['shirt', 'polo', 'casual-shoes']
}

/**
 * Occasion-based suggestions
 */
export const occasionMappings = {
  wedding: {
    required: ['suit', 'dress-shirt', 'dress-shoes', 'tie'],
    optional: ['vest', 'pocket-square', 'cufflinks', 'boutonniere']
  },
  interview: {
    required: ['suit', 'dress-shirt', 'conservative-tie', 'dress-shoes'],
    avoid: ['bold-patterns', 'bright-colors']
  },
  prom: {
    required: ['suit', 'dress-shirt', 'bow-tie', 'dress-shoes'],
    optional: ['vest', 'pocket-square', 'lapel-pin', 'cummerbund']
  },
  'business-meeting': {
    required: ['suit', 'dress-shirt', 'tie', 'dress-shoes'],
    optional: ['pocket-square', 'cufflinks']
  },
  'date-night': {
    required: ['blazer', 'shirt', 'dress-shoes'],
    optional: ['pocket-square', 'cologne']
  }
}