#!/bin/bash

echo "=========================================="
echo "PROCESSING ALL SUITS & TUXEDOS"
echo "=========================================="

# Counter for progress
TOTAL=0
SUCCESS=0
FAILED=0

# Regular Suits - $229.99
echo -e "\n📦 PROCESSING REGULAR SUITS ($229.99)"
echo "----------------------------------------"

SUITS=(
    "2 PC Double Breasted Solid Suit"
    "2 PC Satin Shawl Collar Suit - Ivory/Burgundy"
    "Black Pinstripe Shawl Lapel Double-Breasted Suit"
    "Black Strip Shawl Lapel"
    "Black Suit"
    "Brown Gold Buttons"
    "Brown Suit"
    "Burnt Orange"
    "Classic Navy Suit"
    "Classic Navy Two-Piece Suit"
    "Dark Teal"
    "Estate Blue"
    "Fall Forest Green Mocha Double Breasted Suit"
    "Fall Mocha Double Breasted Suit"
    "Fall Rust"
    "Fall Smoked Blue Double Breasted Suit"
    "Forest Green Mocha Double-Breasted Suit"
    "Light Grey"
    "Mint"
    "Navy Blue Performance Stretch Suit"
    "Navy Suit"
    "Pin Stripe Black"
    "Pin Stripe Brown"
    "Pin Stripe Canyon Clay Double Breasted Suit"
    "Pin Stripe Grey"
    "Pin Stripe Navy"
    "Pink"
    "Brick Fall Suit"
)

for suit in "${SUITS[@]}"; do
    ((TOTAL++))
    echo -e "\n[$TOTAL] Processing: $suit"
    if python3 fix_single_product.py "$suit" 22999; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    sleep 1
done

# $199.99 Tuxedos
echo -e "\n🎩 PROCESSING \$199.99 TUXEDOS"
echo "----------------------------------------"

TUXEDOS_199=(
    "Black On Black Slim Tuxedo Tone Trim Tuxedo"
    "Black Tuxedo"
    "Blush Tuxedo"
    "Burnt Orange Tuxedo"
    "Classic Black Tuxedo with Satin Lapels"
    "Hunter Green Tuxedo"
    "Light Grey On Light Grey Slim Tuxedo Tone Trim Tuxedo"
    "Navy Tone Trim Tuxedo"
    "Sand Tuxedo"
    "Tan Tuxedo Double Breasted"
    "Wine On Wine Slim Tuxedotone Trim Tuxedo"
)

for tux in "${TUXEDOS_199[@]}"; do
    ((TOTAL++))
    echo -e "\n[$TOTAL] Processing: $tux"
    if python3 fix_single_product.py "$tux" 19999; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    sleep 1
done

# $229.99 Tuxedos
echo -e "\n🎩 PROCESSING \$229.99 TUXEDOS"
echo "----------------------------------------"

TUXEDOS_229=(
    "Black Tone Trim Tuxedo Shawl Lapel"
    "Red Tuxedo Double Breasted"
    "White Black Tuxedo"
    "White Tuxedo Double Breasted"
)

for tux in "${TUXEDOS_229[@]}"; do
    ((TOTAL++))
    echo -e "\n[$TOTAL] Processing: $tux"
    if python3 fix_single_product.py "$tux" 22999; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    sleep 1
done

# $249.99 Tuxedos
echo -e "\n💎 PROCESSING \$249.99 TUXEDOS"
echo "----------------------------------------"

TUXEDOS_249=(
    "Black Gold Design Tuxedo"
    "Black Paisley Tuxedo"
    "Blush Pink Paisley Tuxedo"
    "Gold Paisley Tuxedo"
    "Ivory Black Tone Trim Tuxedo"
    "Ivory Gold Paisley Tuxedo"
    "Ivory Paisley Tuxedo"
    "Notch Lapel Black Velvet Tuxedo"
    "Notch Lapel Navy Velvet Tuxedo"
    "Pink Gold Design Tuxedo"
    "Vivid Purple Tuxedo Tone Trim Tuxedo"
)

for tux in "${TUXEDOS_249[@]}"; do
    ((TOTAL++))
    echo -e "\n[$TOTAL] Processing: $tux"
    if python3 fix_single_product.py "$tux" 24999; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    sleep 1
done

echo -e "\n=========================================="
echo "FINAL SUMMARY"
echo "=========================================="
echo "Total Processed: $TOTAL"
echo "✅ Success: $SUCCESS"
echo "❌ Failed: $FAILED"
echo -e "\n✅ SCRIPT COMPLETE!"