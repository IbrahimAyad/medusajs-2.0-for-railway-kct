import { NextResponse } from 'next/server'
import { fetchMedusaProductsPaginated } from '@/services/medusaBackendService'

export async function GET() {
  try {
    // Fetch first batch of products
    const { products } = await fetchMedusaProductsPaginated(1, 10)
    
    // Analyze product structure
    const analysis = products.map(product => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      categories: product.categories,
      metadata: product.metadata,
      pricing_tier: product.pricing_tier,
      // Extract potential category info from title/handle
      titleWords: product.title?.toLowerCase().split(' ') || [],
      handleParts: product.handle?.toLowerCase().split('-') || []
    }))
    
    // Group by detected categories
    const categoryPatterns = {
      suits: ['suit', 'tuxedo', '2-piece', '3-piece', 'two-piece', 'three-piece'],
      blazers: ['blazer', 'jacket', 'sport-coat'],
      shirts: ['shirt', 'dress-shirt'],
      vests: ['vest', 'waistcoat'],
      pants: ['pants', 'trousers', 'slacks'],
      ties: ['tie', 'bowtie', 'bow-tie', 'necktie'],
      accessories: ['suspender', 'belt', 'cufflink', 'pocket-square'],
      shoes: ['shoe', 'oxford', 'loafer', 'boot']
    }
    
    const categorized: Record<string, any[]> = {}
    
    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      categorized[category] = products.filter(product => {
        const title = product.title?.toLowerCase() || ''
        const handle = product.handle?.toLowerCase() || ''
        return patterns.some(pattern => 
          title.includes(pattern) || handle.includes(pattern)
        )
      }).map(p => ({ title: p.title, handle: p.handle }))
    }
    
    // Find uncategorized products
    const allCategorized = new Set(
      Object.values(categorized).flat().map(p => p.title)
    )
    const uncategorized = products.filter(
      p => !allCategorized.has(p.title)
    ).map(p => ({ title: p.title, handle: p.handle }))
    
    return NextResponse.json({
      totalProducts: products.length,
      sampleProducts: analysis.slice(0, 5),
      categorized,
      uncategorized,
      categoryPatterns
    }, { status: 200 })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Failed to analyze products' }, { status: 500 })
  }
}