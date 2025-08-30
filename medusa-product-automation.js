/**
 * Medusa Admin Product Automation Script
 * Uses Playwright to automate manual product creation from CSV
 * 
 * This script reads your CSV and automatically fills in the admin forms
 */

const { chromium } = require('playwright');
const fs = require('fs');
const csv = require('csv-parse/sync');

// Configuration
const ADMIN_URL = 'https://backend-production-7441.up.railway.app/app';
const CSV_FILE = './suits-products.csv';

// Your admin credentials (replace with environment variables in production)
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || 'admin@kctmenswear.com';
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'your_password';

async function automateProductCreation() {
  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Set to true for production
    slowMo: 500 // Slow down for visibility (remove in production)
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login to Admin Panel
    console.log('🔐 Logging into Medusa Admin...');
    await page.goto(ADMIN_URL);
    
    // Wait for login form
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    
    // Fill login credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Products', { timeout: 10000 });
    console.log('✅ Logged in successfully!');

    // 2. Read CSV Data
    const csvContent = fs.readFileSync(CSV_FILE, 'utf8');
    const products = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`📊 Found ${products.length} products to import`);

    // 3. Create Each Product
    for (const [index, product] of products.entries()) {
      console.log(`\n📦 Creating product ${index + 1}/${products.length}: ${product.title}`);
      
      // Navigate to Products page
      await page.click('text=Products');
      await page.waitForSelector('text=New Product', { timeout: 5000 });
      
      // Click New Product button
      await page.click('text=New Product');
      await page.waitForSelector('input[name="title"]', { timeout: 5000 });
      
      // Fill in product details
      await page.fill('input[name="title"]', product.title || '');
      await page.fill('input[name="handle"]', product.handle || '');
      await page.fill('textarea[name="description"]', product.description || '');
      
      // Add thumbnail if provided
      if (product.thumbnail) {
        await page.fill('input[name="thumbnail"]', product.thumbnail);
      }
      
      // Set status to published
      const statusSelect = await page.$('select[name="status"]');
      if (statusSelect) {
        await statusSelect.selectOption('published');
      }
      
      // Add variants (if your CSV has variant data)
      if (product.variant_sku) {
        await page.click('text=Add Variant');
        await page.waitForSelector('input[name="sku"]', { timeout: 5000 });
        
        await page.fill('input[name="sku"]', product.variant_sku);
        await page.fill('input[name="variant_title"]', product.variant_title || 'Default');
        
        // Add price
        if (product.price) {
          await page.fill('input[name="price"]', product.price.toString());
        }
        
        // Add size option if available
        if (product.size) {
          await page.fill('input[name="option_value"]', product.size);
        }
      }
      
      // Save the product
      await page.click('button:has-text("Save")');
      
      // Wait for success message or navigation
      await page.waitForTimeout(2000);
      
      console.log(`✅ Created: ${product.title}`);
      
      // Add delay between products to avoid overwhelming the server
      await page.waitForTimeout(1000);
    }

    console.log('\n🎉 All products created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    // Take screenshot on error for debugging
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

// CSV format this script expects:
const exampleCSV = `
title,handle,description,thumbnail,variant_sku,variant_title,price,size
"2 PC Double Breasted Pin-Stripe Suit","mens-suit-m396sk-02","Elegant suit","https://cdn.shopify.com/image.jpg","M396SK-02-38R","38R","174.99","38R"
"2 PC Double Breasted Solid Suit","mens-suit-m404sk-03","Charcoal suit","https://cdn.shopify.com/image2.jpg","M404SK-03-40R","40R","250.00","40R"
`;

// Run the automation
automateProductCreation()
  .then(() => console.log('✅ Automation complete!'))
  .catch(err => console.error('❌ Automation failed:', err));