# Missing Component Exports Solution

**Issue ID:** BUILD-001  
**Priority:** 🔴 CRITICAL - LAUNCH BLOCKER  
**Estimated Fix Time:** 1-2 hours  
**Risk Level:** HIGH - Build Failures

## Problem Description

### What Was Found
Multiple TypeScript build errors due to missing exports:

```typescript
// Error examples from PRE_LAUNCH_AUDIT_REPORT.md:
'Fabric' is not exported from 'lucide-react'
'supabase' is not exported from '@/lib/supabase/client'

// Additional potential missing exports:
Component imports failing
Type definitions not found
Module resolution errors
```

### Build Impact
- **TypeScript Compilation:** Fails with missing export errors
- **Next.js Build:** Cannot complete production build
- **Development Experience:** IDE errors and auto-complete broken
- **Deployment:** Vercel builds failing

### Root Cause Analysis
1. **Import/Export Mismatches:** Components exported differently than imported
2. **Barrel Export Issues:** Index files not properly exporting components
3. **Dependency Updates:** External packages removing exports
4. **File Structure Changes:** Components moved without updating exports

## Step-by-Step Solution

### IMMEDIATE ACTIONS (Within 30 Minutes)

#### 1. Identify All Missing Exports
```bash
# Check for TypeScript build errors
npx tsc --noEmit --pretty

# Check for specific import errors
grep -r "is not exported" . --include="*.ts" --include="*.tsx" 2>/dev/null || echo "No direct import errors found"

# Check for module resolution issues
grep -r "Cannot find module" . --include="*.ts" --include="*.tsx" 2>/dev/null || echo "No module resolution errors found"
```

#### 2. Fix Lucide-React Icon Issue
```typescript
// Problem: 'Fabric' icon doesn't exist in lucide-react
// Find all uses of Fabric icon
grep -r "Fabric" src/ --include="*.ts" --include="*.tsx"

// Fix 1: Replace with existing icon
// Before:
import { Fabric } from 'lucide-react';

// After (use Shirt or Package icon instead):
import { Shirt } from 'lucide-react';
// or
import { Package } from 'lucide-react';

// Fix 2: Create custom icon component if needed
// components/icons/FabricIcon.tsx
import { LucideProps } from 'lucide-react';

export function FabricIcon(props: LucideProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Custom fabric icon SVG paths */}
      <path d="M6 2l3 6h6l3-6"/>
      <path d="M18 8v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8"/>
      <path d="M10 12h4"/>
      <path d="M10 16h4"/>
    </svg>
  );
}
```

#### 3. Fix Supabase Client Export Issue
```typescript
// Problem: 'supabase' is not exported from '@/lib/supabase/client'
// Check current export structure
// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Ensure proper exports
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export additional client configurations if needed
export const adminSupabase = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Export types
export type { Database } from './database.types';
export type SupabaseClient = typeof supabase;

// Export default for convenience
export default supabase;
```

### COMPREHENSIVE EXPORT AUDIT

#### 1. Automated Export Checker Script
```javascript
// scripts/check-exports.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const ts = require('typescript');

interface ExportIssue {
  file: string;
  line: number;
  issue: string;
  severity: 'error' | 'warning';
  suggestion?: string;
}

function checkExports(): ExportIssue[] {
  console.log('🔍 Checking for export/import issues...\n');
  
  const issues: ExportIssue[] = [];
  const sourceFiles = glob.sync('src/**/*.{ts,tsx}');
  
  sourceFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for common import issues
      const importLines = content.split('\n').map((line, index) => ({ line, index }))
        .filter(({ line }) => line.trim().startsWith('import'));
      
      importLines.forEach(({ line, index }) => {
        // Check for lucide-react issues
        if (line.includes('lucide-react')) {
          const fabricMatch = line.match(/{\s*([^}]*Fabric[^}]*)\s*}/);
          if (fabricMatch) {
            issues.push({
              file: filePath,
              line: index + 1,
              issue: `'Fabric' icon not available in lucide-react`,
              severity: 'error',
              suggestion: 'Use Shirt, Package, or Layers icon instead'
            });
          }
        }
        
        // Check for supabase client issues
        if (line.includes('@/lib/supabase/client') && line.includes('supabase')) {
          // This is likely the issue - verify the export exists
          const clientFile = path.resolve('src/lib/supabase/client.ts');
          if (fs.existsSync(clientFile)) {
            const clientContent = fs.readFileSync(clientFile, 'utf8');
            if (!clientContent.includes('export const supabase') && !clientContent.includes('export default')) {
              issues.push({
                file: filePath,
                line: index + 1,
                issue: `'supabase' not exported from client.ts`,
                severity: 'error',
                suggestion: 'Add proper export in lib/supabase/client.ts'
              });
            }
          }
        }
        
        // Check for missing component imports
        if (line.includes('@/components/')) {
          const componentPath = line.match(/@\/components\/([^'"]+)/);
          if (componentPath) {
            const fullPath = path.resolve(`src/components/${componentPath[1]}.tsx`);
            const tsPath = path.resolve(`src/components/${componentPath[1]}.ts`);
            const indexPath = path.resolve(`src/components/${componentPath[1]}/index.tsx`);
            
            if (!fs.existsSync(fullPath) && !fs.existsSync(tsPath) && !fs.existsSync(indexPath)) {
              issues.push({
                file: filePath,
                line: index + 1,
                issue: `Component file not found: ${componentPath[1]}`,
                severity: 'error',
                suggestion: 'Check file path and ensure component exists'
              });
            }
          }
        }
      });
      
    } catch (error) {
      issues.push({
        file: filePath,
        line: 0,
        issue: `Failed to analyze file: ${error.message}`,
        severity: 'warning'
      });
    }
  });
  
  return issues;
}

function generateFixScript(issues: ExportIssue[]): string {
  let script = '#!/bin/bash\n';
  script += '# Auto-generated fix script for export issues\n\n';
  
  const fabricIssues = issues.filter(i => i.issue.includes('Fabric'));
  if (fabricIssues.length > 0) {
    script += '# Fix Fabric icon imports\n';
    fabricIssues.forEach(issue => {
      script += `sed -i '' 's/Fabric/Shirt/g' "${issue.file}"\n`;
    });
    script += '\n';
  }
  
  const supabaseIssues = issues.filter(i => i.issue.includes('supabase'));
  if (supabaseIssues.length > 0) {
    script += '# Fix supabase client exports\n';
    script += 'echo "export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);" >> src/lib/supabase/client.ts\n';
    script += '\n';
  }
  
  return script;
}

function main() {
  const issues = checkExports();
  
  if (issues.length === 0) {
    console.log('✅ No export issues found!');
    return;
  }
  
  console.log(`Found ${issues.length} export/import issues:\n`);
  
  // Group by severity
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    errors.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.issue}`);
      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(issue => {
      console.log(`   ${issue.file}:${issue.line} - ${issue.issue}`);
      if (issue.suggestion) {
        console.log(`     💡 ${issue.suggestion}`);
      }
    });
    console.log('');
  }
  
  // Generate fix script
  const fixScript = generateFixScript(issues);
  fs.writeFileSync('fix-exports.sh', fixScript);
  fs.chmodSync('fix-exports.sh', '755');
  
  console.log('📝 Generated fix-exports.sh script');
  console.log('Run: ./fix-exports.sh to apply automatic fixes');
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    errors: errors.length,
    warnings: warnings.length,
    issues: issues
  };
  
  fs.writeFileSync('export-issues-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Detailed report saved to export-issues-report.json');
  
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
```

#### 2. Component Export Standardization
```typescript
// lib/exports/standardize-exports.ts

// Standard component export pattern
// components/ui/Button/index.tsx
export { Button } from './Button';
export type { ButtonProps } from './Button';

// components/ui/Button/Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // Implementation
}

// Barrel exports for entire UI library
// components/ui/index.tsx
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { ProductCard } from './ProductCard';
export type { ProductCardProps } from './ProductCard';

// Re-export everything from sub-modules
export * from './forms';
export * from './layout';
export * from './feedback';
```

#### 3. Icon Export Management
```typescript
// components/icons/index.tsx
// Centralized icon management

// Lucide icons (verified to exist)
export {
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X,
  Plus,
  Minus,
  Star,
  Filter,
  Grid,
  List,
  Eye,
  EyeOff,
  Package, // Use instead of Fabric
  Shirt,   // Alternative to Fabric
  Layers,  // Another alternative
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Custom icons for missing lucide icons
export { FabricIcon } from './custom/FabricIcon';
export { SuitIcon } from './custom/SuitIcon';
export { TieIcon } from './custom/TieIcon';

// Icon type for consistency
export type { LucideProps as IconProps } from 'lucide-react';
```

### DEPENDENCY VERIFICATION

#### 1. Package Export Verification Script
```javascript
// scripts/verify-package-exports.js
const fs = require('fs');
const path = require('path');

function verifyPackageExports() {
  console.log('📦 Verifying package exports...\n');
  
  const issues = [];
  
  // Check lucide-react exports
  try {
    const lucidePackagePath = path.resolve('node_modules/lucide-react/package.json');
    const lucidePackage = JSON.parse(fs.readFileSync(lucidePackagePath, 'utf8'));
    
    console.log(`lucide-react version: ${lucidePackage.version}`);
    
    // Try to require the package and check exports
    const lucideExports = require('lucide-react');
    const exportedIcons = Object.keys(lucideExports);
    
    console.log(`Available icons: ${exportedIcons.length}`);
    
    // Check for common icons we use
    const requiredIcons = ['ArrowRight', 'ShoppingCart', 'Heart', 'User', 'Search'];
    const missingIcons = requiredIcons.filter(icon => !exportedIcons.includes(icon));
    
    if (missingIcons.length > 0) {
      issues.push({
        package: 'lucide-react',
        issue: `Missing required icons: ${missingIcons.join(', ')}`
      });
    }
    
    // Check specifically for Fabric icon
    if (!exportedIcons.includes('Fabric')) {
      console.log('⚠️  Fabric icon not available in lucide-react');
      console.log('💡 Suggested alternatives: Shirt, Package, Layers');
    }
    
  } catch (error) {
    issues.push({
      package: 'lucide-react',
      issue: `Failed to verify exports: ${error.message}`
    });
  }
  
  // Check @supabase/supabase-js exports
  try {
    const supabaseExports = require('@supabase/supabase-js');
    console.log('✅ @supabase/supabase-js exports verified');
    
    if (!supabaseExports.createClient) {
      issues.push({
        package: '@supabase/supabase-js',
        issue: 'createClient function not exported'
      });
    }
    
  } catch (error) {
    issues.push({
      package: '@supabase/supabase-js',
      issue: `Failed to verify exports: ${error.message}`
    });
  }
  
  // Check Next.js exports
  try {
    const nextImage = require('next/image');
    const nextLink = require('next/link');
    console.log('✅ Next.js core exports verified');
    
  } catch (error) {
    issues.push({
      package: 'next',
      issue: `Failed to verify Next.js exports: ${error.message}`
    });
  }
  
  if (issues.length === 0) {
    console.log('\n✅ All package exports verified successfully');
  } else {
    console.log('\n❌ Package export issues found:');
    issues.forEach(issue => {
      console.log(`   ${issue.package}: ${issue.issue}`);
    });
  }
  
  return issues;
}

verifyPackageExports();
```

#### 2. Build Verification
```bash
#!/bin/bash
# scripts/verify-build.sh

echo "🏗️  Verifying build after export fixes..."

# Clean previous builds
rm -rf .next
rm -rf dist

# Check TypeScript compilation
echo "📝 Checking TypeScript..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo "✅ TypeScript compilation successful"

# Try Next.js build
echo "🔨 Building Next.js application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Next.js build failed"
  exit 1
fi

echo "✅ Next.js build successful"

# Verify key pages can be generated
echo "🧪 Testing critical pages..."

# Check if key files exist in build
if [ ! -f ".next/static/chunks/pages/index.js" ]; then
  echo "❌ Homepage build failed"
  exit 1
fi

if [ ! -f ".next/static/chunks/pages/products.js" ]; then
  echo "⚠️  Products page may have issues"
fi

echo "✅ Build verification complete"
```

### COMPONENT ARCHITECTURE FIXES

#### 1. Standardized Component Structure
```typescript
// Example: components/products/ProductCard/index.tsx
export { ProductCard } from './ProductCard';
export { ProductCardSkeleton } from './ProductCardSkeleton';
export type { ProductCardProps, ProductCardVariant } from './types';

// components/products/ProductCard/types.ts
export interface ProductCardProps {
  product: Product;
  variant?: ProductCardVariant;
  onAddToCart?: (product: Product) => void;
  onWishlist?: (product: Product) => void;
  showQuickView?: boolean;
}

export type ProductCardVariant = 'default' | 'minimal' | 'detailed';

// components/products/ProductCard/ProductCard.tsx
import type { ProductCardProps } from './types';

export function ProductCard({ product, variant = 'default', ...props }: ProductCardProps) {
  // Implementation
}

// Main products barrel export
// components/products/index.tsx
export { ProductCard } from './ProductCard';
export { ProductGrid } from './ProductGrid';
export { ProductFilters } from './ProductFilters';
export { ProductQuickView } from './ProductQuickView';

export type {
  ProductCardProps,
  ProductGridProps,
  ProductFiltersProps,
  ProductQuickViewProps
} from './types';
```

#### 2. Lib Module Standardization
```typescript
// lib/index.ts - Main barrel export
export { supabase, adminSupabase } from './supabase/client';
export type { Database, SupabaseClient } from './supabase/client';

export { logger } from './logger';
export { formatPrice, formatDate, formatSize } from './utils/format';
export { cn } from './utils/cn';

// Service exports
export { cartService } from './services/cart';
export { productService } from './services/products';
export { authService } from './services/auth';

// Type exports
export type {
  Product,
  CartItem,
  User,
  Order
} from './types';

// Hook exports
export {
  useCart,
  useAuth,
  useProducts,
  useWishlist
} from './hooks';
```

### AUTOMATED FIXES

#### 1. Import Replacement Script
```javascript
// scripts/fix-imports.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const replacements = {
  // Lucide icon replacements
  'import { Fabric }': 'import { Shirt as Fabric }',
  'import { Fabric,': 'import { Shirt as Fabric,',
  ', Fabric }': ', Shirt as Fabric }',
  ', Fabric,': ', Shirt as Fabric,',
  
  // Supabase import fixes
  'import { supabase }': 'import supabase',
  'import supabase,': 'import supabase,',
  
  // Component import fixes
  'from \'@/components/ui\'': 'from \'@/components/ui\'',
  'from \'@/lib/supabase\'': 'from \'@/lib/supabase/client\'',
};

function fixImports() {
  console.log('🔧 Fixing import statements...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}');
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  files.forEach(filePath => {
    totalFiles++;
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(replacements).forEach(([from, to]) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles++;
      console.log(`✅ Fixed: ${filePath}`);
    }
  });
  
  console.log(`\n📊 Results:`);
  console.log(`   Files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n🎉 Import fixes applied successfully!');
  } else {
    console.log('\n✅ No import issues found');
  }
}

fixImports();
```

#### 2. Export Generation Script
```javascript
// scripts/generate-exports.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function generateBarrelExports(directory, outputFile) {
  console.log(`📦 Generating barrel exports for ${directory}...`);
  
  const files = glob.sync(`${directory}/**/*.{ts,tsx}`, {
    ignore: [`${directory}/**/index.{ts,tsx}`, `${directory}/**/*.test.{ts,tsx}`, `${directory}/**/*.spec.{ts,tsx}`]
  });
  
  let exports = [];
  let typeExports = [];
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(path.dirname(outputFile), filePath).replace(/\.[^/.]+$/, "");
    
    // Find component exports
    const componentMatches = content.match(/export\s+(function|const|class)\s+(\w+)/g);
    if (componentMatches) {
      componentMatches.forEach(match => {
        const name = match.match(/(\w+)$/)[1];
        exports.push(`export { ${name} } from './${relativePath}';`);
      });
    }
    
    // Find type exports
    const typeMatches = content.match(/export\s+(interface|type)\s+(\w+)/g);
    if (typeMatches) {
      typeMatches.forEach(match => {
        const name = match.match(/(\w+)$/)[1];
        typeExports.push(`export type { ${name} } from './${relativePath}';`);
      });
    }
  });
  
  // Generate barrel export file
  const barrelContent = [
    '// Auto-generated barrel export file',
    '// Do not edit manually - run npm run generate:exports',
    '',
    '// Component exports',
    ...exports,
    '',
    '// Type exports',
    ...typeExports,
    ''
  ].join('\n');
  
  fs.writeFileSync(outputFile, barrelContent);
  console.log(`✅ Generated ${outputFile} with ${exports.length} components and ${typeExports.length} types`);
}

// Generate barrel exports for major directories
generateBarrelExports('src/components/ui', 'src/components/ui/index.ts');
generateBarrelExports('src/components/products', 'src/components/products/index.ts');
generateBarrelExports('src/components/cart', 'src/components/cart/index.ts');
generateBarrelExports('src/lib/hooks', 'src/lib/hooks/index.ts');
generateBarrelExports('src/lib/services', 'src/lib/services/index.ts');

console.log('\n🎉 All barrel exports generated successfully!');
```

## Testing & Verification

### 1. Build Test Suite
```bash
#!/bin/bash
# scripts/test-exports.sh

echo "🧪 Testing export fixes..."

# Test 1: TypeScript compilation
echo "1. Testing TypeScript compilation..."
npx tsc --noEmit --pretty
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation passed"
else
  echo "❌ TypeScript compilation failed"
  exit 1
fi

# Test 2: Import resolution
echo "2. Testing import resolution..."
node -e "
try {
  require('./src/lib/supabase/client.ts');
  console.log('✅ Supabase client imports work');
} catch (e) {
  console.log('❌ Supabase client import failed:', e.message);
  process.exit(1);
}
"

# Test 3: Component imports
echo "3. Testing component imports..."
node -e "
try {
  const fs = require('fs');
  const glob = require('glob');
  
  const files = glob.sync('src/**/*.{ts,tsx}');
  let hasError = false;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('import { Fabric }') && !content.includes('Shirt as Fabric')) {
      console.log('❌ Found unresolved Fabric import in:', file);
      hasError = true;
    }
  });
  
  if (!hasError) {
    console.log('✅ All component imports resolved');
  } else {
    process.exit(1);
  }
} catch (e) {
  console.log('❌ Component import test failed:', e.message);
  process.exit(1);
}
"

# Test 4: Next.js build
echo "4. Testing Next.js build..."
npm run build > build.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Next.js build passed"
  rm build.log
else
  echo "❌ Next.js build failed"
  echo "Build errors:"
  cat build.log
  exit 1
fi

echo "🎉 All export tests passed!"
```

### 2. Runtime Verification
```typescript
// scripts/verify-runtime-exports.ts
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { Shirt, ShoppingCart, Heart } from 'lucide-react';

async function verifyRuntimeExports() {
  console.log('🔄 Verifying runtime exports...');
  
  const tests = [
    {
      name: 'Supabase client',
      test: () => typeof supabase === 'object' && supabase.auth !== undefined
    },
    {
      name: 'UI components',
      test: () => typeof Button === 'function'
    },
    {
      name: 'Product components',
      test: () => typeof ProductCard === 'function'
    },
    {
      name: 'Lucide icons',
      test: () => typeof Shirt === 'function' && typeof ShoppingCart === 'function'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(({ name, test }) => {
    try {
      if (test()) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name} - test returned false`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - ${error.message}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All runtime export tests passed!');
  }
}

verifyRuntimeExports();
```

## Monitoring & Prevention

### 1. ESLint Rules for Import/Export
```json
// .eslintrc.js
{
  "rules": {
    "import/no-unresolved": "error",
    "import/named": "error",
    "import/default": "error",
    "import/namespace": "error",
    "import/export": "error",
    "import/no-deprecated": "warn",
    "import/no-extraneous-dependencies": "error",
    "import/no-mutable-exports": "error",
    "import/no-unused-modules": "warn",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/consistent-type-exports": "error"
  },
  "settings": {
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true,
        "project": "./tsconfig.json"
      }
    }
  }
}
```

### 2. Pre-commit Hook for Export Validation
```bash
#!/bin/sh
# .husky/pre-commit (addition)

echo "🔍 Checking for export issues..."

# Check for problematic imports
if git diff --cached --name-only | grep -E "\.(ts|tsx)$" | xargs grep -l "import { Fabric }" 2>/dev/null; then
  echo "❌ Found Fabric import (not available in lucide-react)"
  echo "💡 Use Shirt, Package, or Layers instead"
  exit 1
fi

# Quick TypeScript check on staged files
STAGED_TS_FILES=$(git diff --cached --name-only | grep -E "\.(ts|tsx)$")
if [ ! -z "$STAGED_TS_FILES" ]; then
  npx tsc --noEmit --pretty
  if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors detected"
    exit 1
  fi
fi

echo "✅ Export validation passed"
```

## Verification Checklist

### Immediate Verification
- [ ] Replace Fabric icon imports with available alternatives
- [ ] Fix supabase client export structure
- [ ] Verify all component imports resolve correctly
- [ ] Test TypeScript compilation
- [ ] Confirm Next.js build succeeds

### Build Verification
- [ ] No TypeScript compilation errors
- [ ] No module resolution errors
- [ ] All import statements resolve
- [ ] Production build completes successfully
- [ ] Component barrel exports working

### Runtime Verification
- [ ] Components render without errors
- [ ] Icons display correctly
- [ ] Supabase client functions properly
- [ ] No console errors about missing exports
- [ ] All pages load successfully

---

**Next Steps:**
1. Run export checker script
2. Fix identified import/export issues
3. Update component export structure
4. Test build and runtime functionality
5. Implement monitoring and prevention

**Estimated Total Time:** 1-2 hours  
**Dependencies:** None  
**Risk After Fix:** LOW - Build stability restored