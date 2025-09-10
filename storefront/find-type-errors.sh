#!/bin/bash
# Quick script to find potential undefined access patterns

echo "=== Finding potential undefined access patterns ==="
echo ""

echo "1. Object property access without optional chaining:"
grep -r "preferences\." src/ --include="*.ts" --include="*.tsx" | grep -v "preferences\?" | head -10

echo ""
echo "2. Array access patterns that might fail:"
grep -r "\[[a-zA-Z_]*\]" src/ --include="*.ts" --include="*.tsx" | grep -v "as keyof" | grep -v "in " | head -10

echo ""
echo "3. Context access without optional chaining:"
grep -r "context\." src/ --include="*.ts" --include="*.tsx" | grep -v "context\?" | head -10