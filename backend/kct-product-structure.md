# KCT Menswear Product Structure for Medusa

## Product Data Model

### Main Product Fields
- **handle**: Unique identifier (e.g., "suit-navy-2p")
- **title**: Display name (e.g., "Navy Suit - 2 Piece")
- **subtitle**: Short tagline (e.g., "Premium Navy Suit from our core collection")
- **description**: Full product description with features
- **status**: published/draft
- **material**: "Premium Wool Blend"
- **weight**: 1500 (grams for shipping)
- **metadata**: Additional fields for features, care instructions, etc.

### Collections/Categories
- Business Suits
- Wedding Suits
- Event Suits
- Two-Piece Suits
- Three-Piece Suits

### Product Options
1. **Size Type** (determines measurements)
   - Short (5'4" - 5'7")
   - Regular (5'8" - 6'1") 
   - Long (6'2" +)

2. **Chest Size**
   - 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54

3. **Suit Type**
   - 2-Piece Suit
   - 3-Piece Suit (includes vest)

### Variant Structure
Each product will have variants combining:
- Size Type + Chest Size + Suit Type

Example Variants for Navy Suit:
- Navy Suit 34S 2-Piece (SKU: KCT-NAVY-34S-2P)
- Navy Suit 34S 3-Piece (SKU: KCT-NAVY-34S-3P)
- Navy Suit 40R 2-Piece (SKU: KCT-NAVY-40R-2P)
- Navy Suit 40R 3-Piece (SKU: KCT-NAVY-40R-3P)
- Navy Suit 44L 2-Piece (SKU: KCT-NAVY-44L-2P)
- Navy Suit 44L 3-Piece (SKU: KCT-NAVY-44L-3P)

### Pricing Structure
- Base 2-Piece: $299.99
- Base 3-Piece: $319.99
- Size adjustments:
  - Short sizes: Same as base
  - Regular sizes: Base price
  - Long sizes: +$20

### Product Metadata Fields
```json
{
  "features": [
    "Half-canvas construction",
    "Natural shoulder line", 
    "Functional button holes",
    "Peak lapels",
    "Two-button closure"
  ],
  "occasions": ["Business", "Formal", "Wedding"],
  "care_instructions": "Dry clean only, steam to remove wrinkles, store on padded hangers",
  "fit_guide": {
    "short": "5'4\" - 5'7\"",
    "regular": "5'8\" - 6'1\"",
    "long": "6'2\" +"
  },
  "construction": "Half-canvas",
  "lapel_style": "Peak",
  "button_count": 2,
  "vent_style": "Double vent",
  "lining": "Full lining",
  "rating": 4.8,
  "review_count": 127,
  "is_editors_choice": true
}
```

### Images
- Main image (front view)
- Back view
- Side view
- Detail shots (lapel, buttons, lining)
- Model wearing shots

### Inventory Management
- Track by variant (each size combination)
- Low stock alert at 5 units
- Out of stock notification
- Pre-order capability for popular sizes

### Tags
- Color (Navy, Charcoal, Black, Grey, etc.)
- Style (Modern, Classic, Slim)
- Season (All-Season, Summer, Winter)
- Price Range (Under $300, $300-500, Premium)