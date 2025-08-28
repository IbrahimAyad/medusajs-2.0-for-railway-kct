import fs from 'fs';
import path from 'path';

// KCT Product Catalog Generator
// Based on actual KCT website structure

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

const SUITS: SuitProduct[] = [
  {
    handle: 'suit-navy-2p',
    title: 'Navy Suit - 2 Piece',
    subtitle: 'Premium Navy Suit from our core collection',
    description: 'Classic navy suit featuring half-canvas construction, natural shoulder line, functional button holes, peak lapels, and two-button closure. Perfect for business, formal events, and weddings.',
    color: 'Navy',
    basePrice2Piece: 299.99,
    basePrice3Piece: 319.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Natural shoulder line', 'Functional button holes', 'Peak lapels', 'Two-button closure'],
    occasions: ['Business', 'Formal', 'Wedding'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-charcoal-2p',
    title: 'Charcoal Grey Suit - 2 Piece',
    subtitle: 'Premium Charcoal Suit from our business collection',
    description: 'Sophisticated charcoal grey suit with half-canvas construction, notch lapels, two-button closure, and double vents. Ideal for business meetings, interviews, and formal occasions.',
    color: 'Charcoal',
    basePrice2Piece: 299.99,
    basePrice3Piece: 319.99,
    material: 'Premium Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Double vents', 'Full lining'],
    occasions: ['Business', 'Interview', 'Formal'],
    collection: 'business-suits'
  },
  {
    handle: 'suit-black-2p',
    title: 'Black Suit - 2 Piece',
    subtitle: 'Classic Black Suit for formal occasions',
    description: 'Timeless black suit with premium construction, perfect for formal events, black-tie optional occasions, and evening events. Features a modern fit with classic styling.',
    color: 'Black',
    basePrice2Piece: 329.99,
    basePrice3Piece: 349.99,
    material: 'Super 120s Wool',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Satin lining', 'Side vents'],
    occasions: ['Formal', 'Evening', 'Black-tie optional'],
    collection: 'formal-suits'
  },
  {
    handle: 'suit-light-grey-2p',
    title: 'Light Grey Suit - 2 Piece',
    subtitle: 'Modern Light Grey Suit for weddings',
    description: 'Contemporary light grey suit perfect for weddings, summer events, and daytime occasions. Features breathable construction and modern styling.',
    color: 'Light Grey',
    basePrice2Piece: 279.99,
    basePrice3Piece: 299.99,
    material: 'Lightweight Wool Blend',
    features: ['Half-canvas construction', 'Notch lapels', 'Two-button closure', 'Center vent', 'Breathable lining'],
    occasions: ['Wedding', 'Summer', 'Daytime'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-tan-2p',
    title: 'Tan Suit - 2 Piece',
    subtitle: 'Versatile Tan Suit for outdoor events',
    description: 'Stylish tan suit ideal for outdoor weddings, beach ceremonies, and summer occasions. Features lightweight construction for comfort in warm weather.',
    color: 'Tan',
    basePrice2Piece: 269.99,
    basePrice3Piece: 289.99,
    material: 'Cotton-Linen Blend',
    features: ['Unstructured shoulders', 'Patch pockets', 'Two-button closure', 'Single vent', 'Half-lined'],
    occasions: ['Beach Wedding', 'Summer', 'Outdoor'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-midnight-blue-2p',
    title: 'Midnight Blue Suit - 2 Piece',
    subtitle: 'Elegant Midnight Blue for special occasions',
    description: 'Luxurious midnight blue suit that appears nearly black in low light but reveals rich blue tones in natural light. Perfect alternative to black for formal events.',
    color: 'Midnight Blue',
    basePrice2Piece: 349.99,
    basePrice3Piece: 379.99,
    material: 'Super 130s Wool',
    features: ['Full-canvas construction', 'Peak lapels', 'Two-button closure', 'Silk lining', 'Double vents'],
    occasions: ['Wedding', 'Gala', 'Formal'],
    collection: 'wedding-suits'
  },
  {
    handle: 'suit-burgundy-2p',
    title: 'Burgundy Suit - 2 Piece',
    subtitle: 'Bold Burgundy Suit for special events',
    description: 'Statement burgundy suit perfect for cocktail parties, holiday events, and occasions where you want to stand out. Features rich color and impeccable tailoring.',
    color: 'Burgundy',
    basePrice2Piece: 319.99,
    basePrice3Piece: 339.99,
    material: 'Premium Wool',
    features: ['Half-canvas construction', 'Peak lapels', 'Two-button closure', 'Contrast lining', 'Side vents'],
    occasions: ['Cocktail', 'Holiday', 'Special Event'],
    collection: 'event-suits'
  }
];

const SIZE_OPTIONS = {
  short: {
    type: 'S',
    heightRange: '5\'4" - 5\'7"',
    chestSizes: [34, 36, 38, 40, 42, 44, 46, 48, 50],
    priceAdjustment: 0
  },
  regular: {
    type: 'R',
    heightRange: '5\'8" - 6\'1"',
    chestSizes: [34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
    priceAdjustment: 0
  },
  long: {
    type: 'L',
    heightRange: '6\'2" +',
    chestSizes: [38, 40, 42, 44, 46, 48, 50, 52, 54],
    priceAdjustment: 20
  }
};

function generateCSV() {
  const headers = [
    'Product Id', 'Product Handle', 'Product Title', 'Product Subtitle', 'Product Description',
    'Product Status', 'Product Thumbnail', 'Product Weight', 'Product Length', 'Product Width',
    'Product Height', 'Product HS Code', 'Product Origin Country', 'Product MID Code',
    'Product Material', 'Product Collection Id', 'Product Type Id', 'Product Tag 1',
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
    // Generate variants for each size combination
    Object.entries(SIZE_OPTIONS).forEach(([sizeType, sizeConfig]) => {
      // Only generate a subset of sizes for demo (40R, 42R, 44R for each suit)
      const demoCestSizes = sizeType === 'regular' ? [40, 42, 44] : 
                            sizeType === 'short' ? [40, 42] : [42, 44];
      
      demoCestSizes.forEach(chestSize => {
        if (!sizeConfig.chestSizes.includes(chestSize)) return;
        
        // Generate 2-piece variant
        const size = `${chestSize}${sizeConfig.type}`;
        const price2Piece = suit.basePrice2Piece + sizeConfig.priceAdjustment;
        const eurPrice2Piece = Math.round(price2Piece * 0.9 * 100) / 100; // Convert to EUR
        
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
          'TRUE', // Discountable
          '', // External Id
          '', // Variant Id
          `${suit.title.replace(' - 2 Piece', '')} ${size} 2-Piece`,
          `KCT-${suit.color.toUpperCase()}-${size}-2P`,
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
          size,
          'Type',
          '2-Piece',
          `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
          `https://kct-menswear.com/images/suits/${suit.handle}-back.jpg`
        ];
        
        csvRows.push(row2Piece.join(','));
        variantCount++;
        
        // Generate 3-piece variant
        const price3Piece = suit.basePrice3Piece + sizeConfig.priceAdjustment;
        const eurPrice3Piece = Math.round(price3Piece * 0.9 * 100) / 100;
        
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
          'TRUE', // Discountable
          '', // External Id
          '', // Variant Id
          `${suit.title.replace(' - 2 Piece', '')} ${size} 3-Piece`,
          `KCT-${suit.color.toUpperCase()}-${size}-3P`,
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
          size,
          'Type',
          '3-Piece',
          `https://kct-menswear.com/images/suits/${suit.handle}-front.jpg`,
          `https://kct-menswear.com/images/suits/${suit.handle}-back.jpg`
        ];
        
        csvRows.push(row3Piece.join(','));
        variantCount++;
      });
    });
  });

  const outputPath = path.join(__dirname, '../../../kct-full-catalog.csv');
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
  
  console.log('✨ KCT Product Catalog Generated!');
  console.log(`📊 Total products: ${SUITS.length}`);
  console.log(`📦 Total variants: ${variantCount}`);
  console.log(`📁 Output: ${outputPath}`);
  
  // Also copy to Downloads
  const downloadsPath = '/Users/ibrahim/Downloads/kct-full-catalog.csv';
  fs.copyFileSync(outputPath, downloadsPath);
  console.log(`📥 Also copied to: ${downloadsPath}`);
}

// Run the generator
generateCSV();