import {
  ProductCategoryService,
  ProductCollectionService,
  ProductService,
  Logger,
} from '@medusajs/medusa'
import { MedusaContainer } from '@medusajs/types'

/**
 * KCT Menswear Seed Data for Medusa v2
 * This file can be copied to your Medusa project's src/scripts/ directory
 */

interface SeedOptions {
  container: MedusaContainer
  logger: Logger
}

export default async function kctSeed({
  container,
  logger,
}: SeedOptions): Promise<void> {
  const productService = container.resolve<ProductService>('productService')
  const collectionService = container.resolve<ProductCollectionService>('productCollectionService')
  const categoryService = container.resolve<ProductCategoryService>('productCategoryService')

  logger.info('Starting KCT Menswear seed...')

  try {
    // Create Collections First
    const collections = [
      {
        id: 'coll_business_essentials',
        title: 'Business Professional Essentials',
        handle: 'business-professional-essentials',
        description: 'Complete your professional wardrobe with our Business Professional Essentials collection.',
        metadata: {
          seo_title: 'Business Professional Essentials | Premium Men\'s Suits | KCT Menswear',
          featured: true,
          sort_order: 1
        }
      },
      {
        id: 'coll_wedding_formal',
        title: 'Wedding & Formal Events',
        handle: 'wedding-formal-events',
        description: 'Elegant suits and tuxedos for weddings, galas, and special occasions.',
        metadata: {
          seo_title: 'Wedding & Formal Event Suits | Tuxedos & Suits | KCT Menswear',
          featured: true,
          sort_order: 2
        }
      },
      {
        id: 'coll_luxury_tuxedos',
        title: 'Luxury Tuxedos',
        handle: 'luxury-tuxedos',
        description: 'Premium tuxedos for the most formal occasions.',
        metadata: {
          seo_title: 'Luxury Tuxedos | Premium Formal Wear | KCT Menswear',
          featured: true,
          sort_order: 3
        }
      },
      {
        id: 'coll_dress_shirts',
        title: 'Premium Dress Shirts',
        handle: 'premium-dress-shirts',
        description: 'Essential dress shirts for the modern gentleman.',
        metadata: {
          seo_title: 'Premium Dress Shirts | Men\'s Formal Shirts | KCT Menswear',
          featured: true,
          sort_order: 4
        }
      }
    ]

    logger.info('Creating collections...')
    for (const collectionData of collections) {
      try {
        await collectionService.create(collectionData)
        logger.info(`Created collection: ${collectionData.title}`)
      } catch (error) {
        logger.error(`Failed to create collection ${collectionData.title}: ${error.message}`)
      }
    }

    // Sample Products (you would add the full product data here)
    const sampleProducts = [
      {
        title: 'Navy Business Suit - Professional Excellence',
        handle: 'navy-business-suit-professional',
        description: 'Elevate your professional wardrobe with our signature Navy Business Suit.',
        status: 'published',
        type: { value: 'Suit' },
        tags: ['business', 'professional', 'navy', 'suit', 'formal'],
        collection_ids: ['coll_business_essentials'],
        options: [
          {
            title: 'Size',
            values: ['38R', '40R', '42R', '44R', '46R', '48R']
          },
          {
            title: 'Fit',
            values: ['Slim', 'Classic']
          }
        ],
        variants: [
          {
            title: 'Navy Business Suit 42R Slim',
            sku: 'KCT-SUIT-NAVY-42R-SLIM',
            prices: [{ amount: 29999, currency_code: 'USD' }],
            options: [{ value: '42R' }, { value: 'Slim' }],
            manage_inventory: true,
            inventory_quantity: 8
          }
        ],
        metadata: {
          seo_title: 'Navy Business Suit - Professional Men\'s Suit | KCT Menswear',
          material: 'Premium wool blend',
          care_instructions: 'Dry clean only'
        }
      }
    ]

    logger.info('Creating sample products...')
    for (const productData of sampleProducts) {
      try {
        await productService.create(productData)
        logger.info(`Created product: ${productData.title}`)
      } catch (error) {
        logger.error(`Failed to create product ${productData.title}: ${error.message}`)
      }
    }

    logger.info('KCT Menswear seed completed successfully!')
  } catch (error) {
    logger.error('KCT seed failed:', error)
    throw error
  }
}
