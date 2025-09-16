import { MetadataRoute } from 'next';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

// Define the base URL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://kctmenswear.com';

// Static pages that always exist
const staticPages = [
  '',
  '/about',
  '/contact',
  '/locations',
  '/products',
  '/collections',
  '/bundles',
  '/blog',
  '/faq',
  '/privacy-policy',
  '/terms-of-service',
  '/returns',
  '/shipping',
  '/size-guide',
  '/alterations',
  '/rental',
];

// Collection pages
const collections = [
  '/collections/suits',
  '/collections/tuxedos',
  '/collections/wedding',
  '/collections/prom',
  '/collections/business',
  '/collections/shirts',
  '/collections/ties',
  '/collections/accessories',
  '/collections/shoes',
  '/collections/vests',
  '/collections/blazers',
  '/collections/pants',
  '/collections/formal',
  '/collections/casual',
  '/collections/new-arrivals',
  '/collections/sale',
];

// Service pages
const servicePages = [
  '/wedding',
  '/prom',
  '/custom-suits',
  '/rental',
  '/alterations',
  '/style-quiz',
  '/occasions',
  '/atelier-ai',
];

// Helper function to fetch products from Medusa
async function fetchProducts() {
  try {
    // TODO: Implement Medusa product fetching once API is ready
    // For now, return empty array to avoid build errors
    return [];
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
    return [];
  }
}

// Helper function to fetch blog posts
async function fetchBlogPosts() {
  try {
    // TODO: Implement blog post fetching if needed
    // For now, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];

  // Add static pages
  staticPages.forEach((page) => {
    urls.push({
      url: `${BASE_URL}${page}`,
      lastModified: new Date(),
      priority: page === '' ? 1.0 : 0.8,
    });
  });

  // Add collection pages
  collections.forEach((collection) => {
    urls.push({
      url: `${BASE_URL}${collection}`,
      lastModified: new Date(),
      priority: 0.9,
    });
  });

  // Add service pages
  servicePages.forEach((service) => {
    urls.push({
      url: `${BASE_URL}${service}`,
      lastModified: new Date(),
      priority: 0.8,
    });
  });

  // Try to add dynamic product pages
  try {
    const products = await fetchProducts();
    products.forEach((product: any) => {
      if (product.slug) {
        urls.push({
          url: `${BASE_URL}/products/${product.slug}`,
          lastModified: product.updatedAt || new Date(),
          priority: 0.7,
        });
      }
    });
  } catch (error) {
    console.error('Failed to add products to sitemap:', error);
  }

  // Try to add blog posts
  try {
    const posts = await fetchBlogPosts();
    posts.forEach((post: any) => {
      if (post.slug) {
        urls.push({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.updated_at || new Date(),
          priority: 0.6,
        });
      }
    });
  } catch (error) {
    console.error('Failed to add blog posts to sitemap:', error);
  }

  return urls;
}