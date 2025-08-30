#!/bin/bash

echo "=== Setting Up Medusa Product Automation ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "1. Installing Playwright and dependencies..."
npm init -y 2>/dev/null
npm install playwright csv-parse

echo ""
echo "2. Creating sample CSV file..."
cat > suits-products.csv << 'EOF'
title,handle,description,thumbnail,variant_sku,variant_title,price,size
"2 PC Double Breasted Pin-Stripe Suit","mens-suit-m396sk-02","Elegant double-breasted men's suit featuring classic pin-stripe pattern","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg","M396SK-02-38R","38R","174.99","38R"
"2 PC Double Breasted Pin-Stripe Suit","mens-suit-m396sk-02","Elegant double-breasted men's suit featuring classic pin-stripe pattern","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg","M396SK-02-40R","40R","174.99","40R"
"2 PC Double Breasted Pin-Stripe Suit","mens-suit-m396sk-02","Elegant double-breasted men's suit featuring classic pin-stripe pattern","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg","M396SK-02-42R","42R","174.99","42R"
"2 PC Double Breasted Solid Suit","mens-suit-m404sk-03","Versatile charcoal gray double-breasted suit perfect for business","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg","M404SK-03-38R","38R","250.00","38R"
"2 PC Double Breasted Solid Suit","mens-suit-m404sk-03","Versatile charcoal gray double-breasted suit perfect for business","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg","M404SK-03-40R","40R","250.00","40R"
"2 PC Double Breasted Solid Suit","mens-suit-m404sk-03","Versatile charcoal gray double-breasted suit perfect for business","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg","M404SK-03-42R","42R","250.00","42R"
"2 PC Satin Shawl Collar Suit","mens-suit-m341sk-06","Rich burgundy suit with satin shawl collar","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg","M341SK-06-38R","38R","174.99","38R"
"2 PC Satin Shawl Collar Suit","mens-suit-m341sk-06","Rich burgundy suit with satin shawl collar","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg","M341SK-06-40R","40R","174.99","40R"
"2 PC Satin Shawl Collar Suit","mens-suit-m341sk-06","Rich burgundy suit with satin shawl collar","https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg","M341SK-06-42R","42R","174.99","42R"
EOF

echo "✅ CSV file created: suits-products.csv"

echo ""
echo "3. Installing Playwright browsers..."
npx playwright install chromium

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "To run the automation:"
echo "1. Edit medusa-product-automation.js with your admin password"
echo "2. Run: node medusa-product-automation.js"
echo ""
echo "The script will:"
echo "✓ Login to your Medusa admin panel"
echo "✓ Read products from suits-products.csv"
echo "✓ Automatically create each product"
echo "✓ Fill in all fields and save"
echo ""
echo "Watch it work in real-time (headless: false mode)!"