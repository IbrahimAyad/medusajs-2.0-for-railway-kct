import fs from 'fs';
import path from 'path';

// KCT Complete Product Catalog Generator
// Based on actual KCT website products with updated pricing

interface SuitProduct {
  handle: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  basePrice2Piece: number;
  basePrice3Piece: number;
  material: string;
  features: string[];
  occasions: string[];
  collection: string;
}

interface SizeOption {
  type: string; // Short, Regular, Long
  chest: number; // 34-54
  heightRange: string;
  priceAdjustment: number;
}

// Complete list of suits from KCT website
const SUITS: SuitProduct[] = [
  // From first image set
  {
    handle: 'suit-burgundy',
    title: 'Burgundy Suit',
    subtitle: 'Premium Burgundy Suit - Bold & Sophisticated',
    description: 'Make a statement with our rich burgundy suit. Perfect for special events, cocktail parties, and occasions where you want to stand out with sophisticated style.',
    color: 'Burgundy',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Contrast lining'],
    occasions: ['Special Events', 'Cocktail', 'Evening', 'Holiday'],
    collection: 'event-suits'
  },
  {
    handle: 'suit-emerald',
    title: 'Emerald Suit',
    subtitle: 'Premium Emerald Green Suit - Unique & Elegant',
    description: 'Stand out with our stunning emerald green suit. Perfect for creative events, galas, and making a memorable impression at special occasions.',
    color: 'Emerald',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Silk lining'],
    occasions: ['Gala', 'Creative Events', 'Special Occasions', 'Evening'],
    collection: 'event-suits'
  },
  {
    handle: 'suit-hunter-green',
    title: 'Hunter Green Suit',
    subtitle: 'Premium Hunter Green Suit - Classic Deep Green',
    description: 'Sophisticated hunter green suit offering a perfect balance between bold and professional. Ideal for fall events and evening occasions.',
    color: 'Hunter Green',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Center vent', 'Full lining'],
    occasions: ['Fall Events', 'Business Casual', 'Evening', 'Special Occasions'],
    collection: 'event-suits'
  },
  {
    handle: 'suit-indigo',
    title: 'Indigo Suit',
    subtitle: 'Premium Indigo Suit - Deep Blue Excellence',
    description: 'Rich indigo suit that offers versatility for both business and special occasions. A modern alternative to traditional navy with deeper, richer tones.',
    color: 'Indigo',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Silk blend lining'],
    occasions: ['Business', 'Evening', 'Wedding', 'Special Events'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-midnight-blue',
    title: 'Midnight Blue Suit',
    subtitle: 'Premium Midnight Blue Suit - Elegant Alternative to Black',
    description: 'Luxurious midnight blue suit that appears nearly black in low light but reveals rich blue tones in natural light. Perfect for formal events and black-tie optional occasions.',
    color: 'Midnight Blue',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Super 120s Wool',
    features: ['Full-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Premium silk lining'],
    occasions: ['Formal', 'Black-tie Optional', 'Wedding', 'Gala'],
    collection: 'formal-suits'
  },
  // From second image set
  {
    handle: 'suit-beige',
    title: 'Beige Suit',
    subtitle: 'Premium Beige Suit - Light & Sophisticated',
    description: 'Elegant beige suit perfect for summer events, outdoor weddings, and daytime occasions. Light, breathable, and stylish.',
    color: 'Beige',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Lightweight Wool-Cotton Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Center vent', 'Half-lined for breathability'],
    occasions: ['Summer', 'Outdoor Wedding', 'Daytime', 'Resort'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-brown',
    title: 'Brown Suit',
    subtitle: 'Premium Brown Suit - Warm & Versatile',
    description: 'Classic brown suit offering warmth and sophistication. Perfect for fall events, business casual settings, and creative industries.',
    color: 'Brown',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Double vents', 'Full lining'],
    occasions: ['Fall', 'Business Casual', 'Creative', 'Daytime'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-dark-brown',
    title: 'Dark Brown Suit',
    subtitle: 'Premium Dark Brown Suit - Rich & Professional',
    description: 'Sophisticated dark brown suit combining professionalism with unique style. Excellent choice for business meetings and evening events.',
    color: 'Dark Brown',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Silk blend lining'],
    occasions: ['Business', 'Evening', 'Fall/Winter', 'Formal'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-sand',
    title: 'Sand Suit',
    subtitle: 'Premium Sand Suit - Light & Elegant',
    description: 'Refined sand-colored suit ideal for beach weddings, summer events, and destination occasions. Light, comfortable, and sophisticated.',
    color: 'Sand',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Lightweight Linen-Wool Blend',
    features: ['Unstructured shoulders', 'Notch lapels', 'Two-button closure', 'Single vent', 'Half-lined'],
    occasions: ['Beach Wedding', 'Summer', 'Destination', 'Resort'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-tan',
    title: 'Tan Suit',
    subtitle: 'Premium Tan Suit - Versatile & Stylish',
    description: 'Versatile tan suit perfect for outdoor events, summer occasions, and casual weddings. Combines style with comfort.',
    color: 'Tan',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Cotton-Wool Blend',
    features: ['Soft construction', 'Notch lapels', 'Two-button closure', 'Center vent', 'Half-lined'],
    occasions: ['Outdoor Wedding', 'Summer', 'Casual Events', 'Daytime'],
    collection: 'wedding-suits'
  },
  // Classic colors that should also be included
  {
    handle: 'suit-navy',
    title: 'Navy Suit',
    subtitle: 'Premium Navy Suit - The Essential Classic',
    description: 'Timeless navy suit that forms the foundation of any formal wardrobe. Perfect for business, weddings, and all formal occasions.',
    color: 'Navy',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Double vents', 'Full lining'],
    occasions: ['Business', 'Wedding', 'Formal', 'All Occasions'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-charcoal',
    title: 'Charcoal Grey Suit',
    subtitle: 'Premium Charcoal Suit - Professional Excellence',
    description: 'Sophisticated charcoal grey suit ideal for business meetings, interviews, and formal events. A versatile staple for the modern professional.',
    color: 'Charcoal',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Double vents', 'Full lining'],
    occasions: ['Business', 'Interview', 'Formal', 'Professional'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-light-grey',
    title: 'Light Grey Suit',
    subtitle: 'Premium Light Grey Suit - Modern & Fresh',
    description: 'Contemporary light grey suit perfect for daytime events, summer weddings, and modern business settings.',
    color: 'Light Grey',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Lightweight Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Center vent', 'Breathable lining'],
    occasions: ['Wedding', 'Summer', 'Business Casual', 'Daytime'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-black',
    title: 'Black Suit',
    subtitle: 'Premium Black Suit - Formal Perfection',
    description: 'Classic black suit for the most formal occasions. Essential for black-tie optional events, evening occasions, and formal business.',
    color: 'Black',
    basePrice2Piece: 179.99,
    basePrice3Piece: 199.99,
    material: 'Super 110s Wool',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Double vents', 'Satin lining'],
    occasions: ['Formal', 'Evening', 'Black-tie Optional', 'Business'],
    collection: 'formal-suits'
  }
];

const SIZE_OPTIONS = {
  short: {
    type: 'S',
    heightRange: '5\'4" - 5\'7"',
    chestSizes: [36, 38, 40, 42, 44, 46],
    priceAdjustment: 0
  },
  regular: {
    type: 'R',
    heightRange: '5\'8" - 6\'1"',
    chestSizes: [36, 38, 40, 42, 44, 46, 48, 50],
    priceAdjustment: 0
  },
  long: {
    type: 'L',
    heightRange: '6\'2" +',
    chestSizes: [40, 42, 44, 46, 48, 50],
    priceAdjustment: 0  // No price adjustment for long sizes with new pricing
  }
};

function generateCSV() {
  const headers = [
    'Product Id', 'Product Handle', 'Product Title', 'Product Subtitle', 'Product Description',
    'Product Status', 'Product Thumbnail', 'Product Weight', 'Product Length', 'Product Width',
    'Product Height', 'Product HS Code', 'Product Origin Country', 'Product MID Code',
    'Product Material', 'Product Collection Id', 'Product Type Id', 'Product Tag 1', 'Product Tag 2',
    'Product Discountable', 'Product External Id', 'Variant Id', 'Variant Title',
    'Variant SKU', 'Variant Barcode', 'Variant Allow Backorder', 'Variant Manage Inventory',
    'Variant Weight', 'Variant Length', 'Variant Width', 'Variant Height',
    'Variant HS Code', 'Variant Origin Country', 'Variant MID Code', 'Variant Material',
    'Variant Price EUR', 'Variant Price USD', 'Variant Option 1 Name', 'Variant Option 1 Value',
    'Variant Option 2 Name', 'Variant Option 2 Value', 'Product Image 1 Url', 'Product Image 2 Url'
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.join(','));

  let variantCount = 0;

  SUITS.forEach(suit => {
    // Generate variants for common sizes only (to keep file manageable)
    // Using Regular sizes: 38R, 40R, 42R, 44R, 46R
    const commonSizes = [
      { size: '38R', type: 'R', chest: 38 },
      { size: '40R', type: 'R', chest: 40 },
      { size: '42R', type: 'R', chest: 42 },
      { size: '44R', type: 'R', chest: 44 },
      { size: '46R', type: 'R', chest: 46 }
    ];
    
    commonSizes.forEach(sizeInfo => {
      // Generate 2-piece variant
      const price2Piece = suit.basePrice2Piece;
      const eurPrice2Piece = Math.round(price2Piece * 0.92 * 100) / 100; // Convert to EUR
      
      const row2Piece = [
        '', // Product Id
        suit.handle,
        suit.title,
        suit.subtitle,
        `"${suit.description}"`,
        'published',
        `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
        '1500', // Weight in grams
        '', '', '', // Dimensions
        '6203.39.10', // HS Code for suits
        'USA',
        '', // MID Code
        suit.material,
        suit.collection,
        'suits',
        suit.color,
        '2-Piece',
        'TRUE', // Discountable
        '', // External Id
        '', // Variant Id
        `${suit.title} ${sizeInfo.size} 2-Piece`,
        `KCT-${suit.color.toUpperCase().replace(' ', '-')}-${sizeInfo.size}-2P`,
        '', // Barcode
        'FALSE', // Allow Backorder
        'TRUE', // Manage Inventory
        '1500', // Variant Weight
        '', '', '', // Variant dimensions
        '', '', '', // Variant codes
        suit.material,
        eurPrice2Piece.toFixed(2),
        price2Piece.toFixed(2),
        'Size',
        sizeInfo.size,
        'Type',
        '2-Piece',
        `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
        `https://kct-menswear.com/images/suits/${suit.handle}-back.jpg`
      ];
      
      csvRows.push(row2Piece.join(','));
      variantCount++;
      
      // Generate 3-piece variant
      const price3Piece = suit.basePrice3Piece;
      const eurPrice3Piece = Math.round(price3Piece * 0.92 * 100) / 100;
      
      const row3Piece = [
        '', // Product Id
        suit.handle,
        suit.title,
        suit.subtitle,
        `"${suit.description}"`,
        'published',
        `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
        '1600', // Weight in grams (heavier for 3-piece)
        '', '', '', // Dimensions
        '6203.39.10', // HS Code
        'USA',
        '', // MID Code
        suit.material,
        suit.collection,
        'suits',
        suit.color,
        '3-Piece',
        'TRUE', // Discountable
        '', // External Id
        '', // Variant Id
        `${suit.title} ${sizeInfo.size} 3-Piece`,
        `KCT-${suit.color.toUpperCase().replace(' ', '-')}-${sizeInfo.size}-3P`,
        '', // Barcode
        'FALSE', // Allow Backorder
        'TRUE', // Manage Inventory
        '1600', // Variant Weight
        '', '', '', // Variant dimensions
        '', '', '', // Variant codes
        suit.material,
        eurPrice3Piece.toFixed(2),
        price3Piece.toFixed(2),
        'Size',
        sizeInfo.size,
        'Type',
        '3-Piece',
        `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
        `https://kct-menswear.com/images/suits/${suit.handle}-back.jpg`
      ];
      
      csvRows.push(row3Piece.join(','));
      variantCount++;
    });
  });

  const outputPath = path.join(__dirname, '../../../kct-complete-catalog.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
  
  console.log('✨ KCT Complete Product Catalog Generated!');
  console.log(`📊 Total products: ${SUITS.length}`);
  console.log(`📦 Total variants: ${variantCount}`);
  console.log(`💰 Pricing: $179.99 (2-Piece) / $199.99 (3-Piece)`);
  console.log(`📁 Output: ${outputPath}`);
  
  // Also copy to Downloads
  const downloadsPath = '/Users/ibrahim/Downloads/kct-complete-catalog.csv';
  fs.copyFileSync(outputPath, downloadsPath);
  console.log(`📥 Also copied to: ${downloadsPath}`);
}

// Run the generator
generateCSV();