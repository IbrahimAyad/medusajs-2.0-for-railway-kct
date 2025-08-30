// Direct product creation script for Medusa
// Run with: npx medusa exec scripts/create-products.js

const products = [
  {
    title: "2 PC Double Breasted Pin-Stripe Suit",
    handle: "mens-suit-m396sk-02",
    description: "Elegant double-breasted men's suit featuring classic pin-stripe pattern. Includes matching jacket and pants. Perfect for formal occasions and business wear.",
    status: "published",
    thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg",
    images: [
      { url: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg" }
    ],
    metadata: {
      shopify_id: "9736048476473",
      vendor: "Tazzio",
      product_type: "Mens-suit",
      material: "Polyester Blend"
    },
    variants: [
      { title: "36S", sku: "M396SK-02-36S", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "36S" }] },
      { title: "38R", sku: "M396SK-02-38R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "38R" }] },
      { title: "40R", sku: "M396SK-02-40R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "40R" }] },
      { title: "42R", sku: "M396SK-02-42R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "42R" }] },
      { title: "44R", sku: "M396SK-02-44R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "44R" }] }
    ]
  },
  {
    title: "2 PC Double Breasted Solid Suit", 
    handle: "mens-suit-m404sk-03",
    description: "Versatile charcoal gray double-breasted suit. Perfect for business and formal events. Our best-selling style with exceptional fit and finish.",
    status: "published",
    thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg",
    images: [
      { url: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg" }
    ],
    metadata: {
      shopify_id: "9776181510457",
      vendor: "Tazzio",
      product_type: "Mens-suit",
      material: "Premium Polyester",
      high_stock: true,
      total_inventory: 206
    },
    variants: [
      { title: "36S", sku: "M404SK-03-36S", prices: [{ amount: 25000, currency_code: "usd" }], options: [{ value: "36S" }] },
      { title: "38R", sku: "M404SK-03-38R", prices: [{ amount: 25000, currency_code: "usd" }], options: [{ value: "38R" }] },
      { title: "40R", sku: "M404SK-03-40R", prices: [{ amount: 25000, currency_code: "usd" }], options: [{ value: "40R" }] },
      { title: "42R", sku: "M404SK-03-42R", prices: [{ amount: 25000, currency_code: "usd" }], options: [{ value: "42R" }] },
      { title: "44R", sku: "M404SK-03-44R", prices: [{ amount: 25000, currency_code: "usd" }], options: [{ value: "44R" }] }
    ]
  },
  {
    title: "2 PC Satin Shawl Collar Suit",
    handle: "mens-suit-m341sk-06",
    description: "Rich burgundy suit with satin shawl collar. Stand out at any formal occasion. Perfect for prom, weddings and special events.",
    status: "published",
    thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg",
    images: [
      { url: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg" }
    ],
    metadata: {
      shopify_id: "9736048738617",
      vendor: "Tazzio",
      product_type: "Mens-suit",
      material: "Polyester with Satin",
      color: "Burgundy",
      total_inventory: 99
    },
    variants: [
      { title: "36S", sku: "M341SK-06-36S", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "36S" }] },
      { title: "38R", sku: "M341SK-06-38R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "38R" }] },
      { title: "40R", sku: "M341SK-06-40R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "40R" }] },
      { title: "42R", sku: "M341SK-06-42R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "42R" }] },
      { title: "44R", sku: "M341SK-06-44R", prices: [{ amount: 17499, currency_code: "usd" }], options: [{ value: "44R" }] }
    ]
  }
];

async function createProducts(container) {
  const productService = container.resolve("productModuleService");
  
  console.log("Starting product creation...");
  
  for (const productData of products) {
    try {
      console.log(`Creating product: ${productData.title}`);
      
      // Create product with variants
      const product = await productService.create({
        ...productData,
        options: [{ title: "Size" }]
      });
      
      console.log(`✓ Created: ${product.title} (${product.id})`);
    } catch (error) {
      console.error(`✗ Failed to create ${productData.title}:`, error.message);
    }
  }
  
  console.log("Product creation complete!");
}

export default createProducts;