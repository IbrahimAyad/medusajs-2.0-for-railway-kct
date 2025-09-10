#!/bin/bash

# Array of collection pages that need Suspense boundaries
pages=(
  "velvet-blazers"
  "date-night"
  "suspender-bowtie"
  "cocktail"
  "black-tie"
  "business"
  "complete-looks"
  "vest-tie-sets"
  "vests"
  "wedding"
  "suits"
)

for page in "${pages[@]}"; do
  file="src/app/collections/${page}/page.tsx"
  
  # Check if file exists
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # Check if already has Suspense
    if grep -q "Suspense" "$file"; then
      echo "  ✓ Already has Suspense"
    else
      # Create temp file with updated content
      cat > "${file}.tmp" << 'EOF'
import { Suspense } from 'react';
import SmartCollectionPage from '@/components/collections/SmartCollectionPage';

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy"></div>
    </div>
  );
}

export default function PAGE_NAME() {
EOF
      
      # Extract the existing function content
      collection_id=$(grep -oP "collectionId=\"\K[^\"]*" "$file" || echo "")
      
      # Add the specific collection ID
      echo "  // Auto-wrapped in Suspense for useSearchParams" >> "${file}.tmp"
      echo "  return (" >> "${file}.tmp"
      echo "    <Suspense fallback={<LoadingState />}>" >> "${file}.tmp"
      echo "      <SmartCollectionPage collectionId=\"${collection_id}\" />" >> "${file}.tmp"
      echo "    </Suspense>" >> "${file}.tmp"
      echo "  );" >> "${file}.tmp"
      echo "}" >> "${file}.tmp"
      
      # Replace PAGE_NAME with proper function name
      page_camel=$(echo "$page" | sed 's/-\([a-z]\)/\U\1/g' | sed 's/^./\U&/')
      sed -i "s/PAGE_NAME/${page_camel}CollectionPage/g" "${file}.tmp"
      
      # Move temp file to original
      mv "${file}.tmp" "$file"
      echo "  ✓ Updated with Suspense boundary"
    fi
  fi
done

echo "All collection pages updated!"