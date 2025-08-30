# KCT Menswear Product Attributes - Industry Standards Documentation

## 1. WEIGHT SPECIFICATIONS

### Suits & Tuxedos (2-Piece & 3-Piece)
- **Product Weight**: 3-4 lbs (1.4-1.8 kg)
- **Shipping Weight**: 4-5 lbs (includes packaging)
- **Note**: 3-piece suits add ~0.5 lbs for vest

### Blazers & Sport Coats
- **Product Weight**: 2-3 lbs (0.9-1.4 kg)
- **Shipping Weight**: 3-4 lbs (includes packaging)
- **Note**: Velvet blazers slightly heavier (~0.3 lbs more)

### Vests/Waistcoats
- **Product Weight**: 0.5-0.8 lbs (0.2-0.4 kg)
- **Shipping Weight**: 1-1.5 lbs (includes packaging)

### Dress Pants
- **Product Weight**: 1-1.5 lbs (0.45-0.7 kg)
- **Shipping Weight**: 1.5-2 lbs (includes packaging)

### Dress Shirts
- **Product Weight**: 0.5-0.7 lbs (0.2-0.3 kg)
- **Shipping Weight**: 1-1.2 lbs (includes packaging)

### Accessories (Suspenders, Bowties, Ties)
- **Product Weight**: 0.25 lbs (4 oz / 113g)
- **Shipping Weight**: 0.5-0.6 lbs (8-9 oz with packaging)

## 2. DIMENSION SPECIFICATIONS

### Suits & Tuxedos (Folded for Shipping)
- **Length**: 24 inches (61 cm)
- **Width**: 18 inches (46 cm)
- **Height**: 4-6 inches (10-15 cm)

### Blazers (Folded)
- **Length**: 22 inches (56 cm)
- **Width**: 16 inches (41 cm)
- **Height**: 3-4 inches (8-10 cm)

### Vests
- **Length**: 16 inches (41 cm)
- **Width**: 12 inches (30 cm)
- **Height**: 2 inches (5 cm)

### Dress Pants
- **Length**: 18 inches (46 cm)
- **Width**: 14 inches (36 cm)
- **Height**: 2-3 inches (5-8 cm)

### Accessories
- **Suspenders/Bowties Box**: 13 x 4 x 2 inches (33 x 10 x 5 cm)
- **Individual items**: 8 x 4 x 1 inches (20 x 10 x 2.5 cm)

## 3. HS CODES (Harmonized System)

### Primary Classifications
- **Men's Suits (woven)**: 6203.11 - 6203.19
- **Men's Blazers/Jackets**: 6203.31 - 6203.39
- **Men's Trousers**: 6203.41 - 6203.49
- **Men's Vests (woven)**: 6211.32 - 6211.33
- **Men's Shirts**: 6205.20 - 6205.90
- **Ties/Bowties**: 6215.10 - 6215.20
- **Suspenders**: 6212.90

### Specific Codes by Material
- **Wool Suits**: 6203.11
- **Synthetic Suits**: 6203.12
- **Other Material Suits**: 6203.19
- **Wool Blazers**: 6203.31
- **Cotton Blazers**: 6203.32
- **Synthetic Blazers**: 6203.33

## 4. MID CODES (Manufacturer Identification)
- Recommend format: **KCT-[YEAR]-[PRODUCT]-[NUMBER]**
- Example: KCT-2025-SUIT-001

## 5. COUNTRY OF ORIGIN
Based on typical industry practices:
- **Imported Items**: Likely "CN" (China), "VN" (Vietnam), "IT" (Italy for luxury)
- **Domestic Items**: "US" (United States)
- **Note**: Verify actual origin with suppliers

## 6. PACKAGING STANDARDS

### Box Types by Product
- **Suits/Tuxedos**: 24x18x6 inch boxes
- **Blazers**: 22x16x4 inch boxes
- **Multiple Items**: Wardrobe boxes with hanging rod
- **Accessories**: Small boxes 13x4x2 inches

### Packaging Weight Addition
- Add 20-30% to product weight for standard packaging
- Add 50-100% for fragile/luxury items with extra protection

## 7. SHIPPING CALCULATIONS

### Dimensional Weight Formula
- **(Length × Width × Height) / 139** = Dimensional Weight (lbs)
- Use whichever is greater: actual weight or dimensional weight

### Example Calculations
- **Suit**: 24×18×6 = 2,592 / 139 = 18.6 lbs dimensional weight
- **Use actual weight**: 4-5 lbs (since it's less)
- **Blazer**: 22×16×4 = 1,408 / 139 = 10.1 lbs dimensional weight
- **Use actual weight**: 3-4 lbs (since it's less)

## 8. RECOMMENDED DATABASE VALUES

### For Suits/Tuxedos
```sql
weight: 1800 -- grams
height: 610  -- mm
width: 460   -- mm
length: 100  -- mm
hs_code: "620311"
origin_country: "US" -- or actual origin
mid_code: "KCT-2025-SUIT-XXX"
```

### For Blazers
```sql
weight: 1400 -- grams
height: 560  -- mm
width: 410   -- mm
length: 80   -- mm
hs_code: "620331"
origin_country: "US" -- or actual origin
mid_code: "KCT-2025-BLZR-XXX"
```

### For Vests
```sql
weight: 400  -- grams
height: 410  -- mm
width: 300   -- mm
length: 50   -- mm
hs_code: "621132"
origin_country: "US" -- or actual origin
mid_code: "KCT-2025-VEST-XXX"
```

### For Accessories
```sql
weight: 113  -- grams
height: 330  -- mm
width: 100   -- mm
length: 50   -- mm
hs_code: "621210" -- suspenders or "621520" for ties
origin_country: "US" -- or actual origin
mid_code: "KCT-2025-ACCS-XXX"
```

## Important Notes:
1. These are industry averages - actual weights may vary by material
2. Velvet, wool, and heavier fabrics add 10-20% to base weight
3. Always round up shipping weights for safety margin
4. HS codes may need refinement based on exact material composition
5. Country of origin must be verified with actual suppliers/manufacturers
6. Consider seasonal variations (winter items are heavier)