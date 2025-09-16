'use client';

import { useEffect, useState } from 'react';
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client';
import { getCollectionById } from '@/lib/config/collection-mapping';
import Image from 'next/image';
import SafeLink from '@/components/ui/SafeLink';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MedusaCollectionPageProps {
  collectionId: string;
}

export default function MedusaCollectionPage({ collectionId }: MedusaCollectionPageProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');
  
  const collection = getCollectionById(collectionId);

  useEffect(() => {
    fetchProducts();
  }, [collectionId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all products from Medusa
      const response = await medusa.store.product.list({
        limit: 100,
        region_id: MEDUSA_CONFIG.regionId,
        fields: "*variants,*variants.prices,*images,*collection"
      });
      
      if (response.products) {
        // Log to see what we're getting from Medusa
        console.log('Medusa products received:', response.products.length);
        console.log('First product example:', response.products[0]);
        
        // Detailed price debugging
        if (response.products[0]) {
          const firstProduct = response.products[0];
          console.log('=== PRICE DEBUG ===');
          console.log('Product title:', firstProduct.title);
          console.log('First variant:', firstProduct.variants?.[0]);
          console.log('First variant prices array:', firstProduct.variants?.[0]?.prices);
          console.log('First price object:', firstProduct.variants?.[0]?.prices?.[0]);
          console.log('Price amount:', firstProduct.variants?.[0]?.prices?.[0]?.amount);
          console.log('===================');
        }
        
        // For now, show ALL products to see what we have
        // We'll add filtering once we understand the data structure
        let filteredProducts = response.products;
        
        // Optional: Filter by collection title if needed
        // Commenting out for now to see all products
        /*
        if (collectionId === 'vests') {
          filteredProducts = response.products.filter(p => 
            p.title?.toLowerCase().includes('vest') ||
            p.collection?.title?.toLowerCase().includes('vest') ||
            p.tags?.some((tag: any) => tag.value?.toLowerCase().includes('vest'))
          );
        } else if (collectionId === 'suits') {
          filteredProducts = response.products.filter(p => 
            p.title?.toLowerCase().includes('suit') ||
            p.collection?.title?.toLowerCase().includes('suit')
          );
        } else if (collectionId === 'shirts') {
          filteredProducts = response.products.filter(p => 
            p.title?.toLowerCase().includes('shirt') ||
            p.collection?.title?.toLowerCase().includes('shirt')
          );
        }
        */
        
        // Sort products
        const sorted = [...filteredProducts];
        switch (sortBy) {
          case 'price-low':
            sorted.sort((a, b) => {
              const priceA = a.variants?.[0]?.prices?.[0]?.amount || 0;
              const priceB = b.variants?.[0]?.prices?.[0]?.amount || 0;
              return priceA - priceB;
            });
            break;
          case 'price-high':
            sorted.sort((a, b) => {
              const priceA = a.variants?.[0]?.prices?.[0]?.amount || 0;
              const priceB = b.variants?.[0]?.prices?.[0]?.amount || 0;
              return priceB - priceA;
            });
            break;
          case 'name':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
        }
        
        setProducts(sorted);
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {collection.marketingName}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {collection.description}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="featured">Featured</option>
                <option value="name">Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {collection.marketingName}...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading products</p>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">No products found in this collection</p>
              <SafeLink href="/kct-shop">
                <Button>Browse All Products</Button>
              </SafeLink>
            </div>
          ) : (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid' 
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
                : 'grid-cols-1'
            )}>
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({ product, viewMode }: { product: any; viewMode: 'grid' | 'list' }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const productImage = product.thumbnail || product.images?.[0]?.url || '/placeholder-product.jpg';
  
  // Medusa 2.0 returns amount in DOLLARS, not cents!
  const rawPrice = product.variants?.[0]?.prices?.[0]?.amount || 0;
  console.log(`Product: ${product.title}, Price from Medusa: ${rawPrice} (already in dollars)`);
  
  // DO NOT divide by 100 - amount is already in dollars!
  const productPrice = rawPrice;
  const productUrl = `/products/${product.handle || product.id}`;

  if (viewMode === 'list') {
    return (
      <div className="flex gap-6 p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
        <SafeLink href={productUrl} className="relative w-48 h-48 flex-shrink-0">
          <Image
            src={imageError ? '/placeholder-product.jpg' : productImage}
            alt={product.title}
            fill
            className="object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
        </SafeLink>
        <div className="flex-1">
          <SafeLink href={productUrl}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:underline">{product.title}</h3>
          </SafeLink>
          <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
          <p className="text-2xl font-bold text-gray-900 mb-4">${productPrice.toFixed(2)}</p>
          <div className="flex gap-2">
            <SafeLink href={productUrl} className="flex-1">
              <Button className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                View Details
              </Button>
            </SafeLink>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-red-500 text-red-500')} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <SafeLink href={productUrl} className="block cursor-pointer">
        <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={imageError ? '/placeholder-product.jpg' : productImage}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-red-500 text-red-500')} />
          </button>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 hover:underline">
          {product.title}
        </h3>
        <p className="text-lg font-bold text-gray-900">
          ${productPrice.toFixed(2)}
        </p>
      </SafeLink>
      <SafeLink href={productUrl}>
        <Button 
          className="w-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
          size="sm"
        >
          View Details
        </Button>
      </SafeLink>
    </div>
  );
}