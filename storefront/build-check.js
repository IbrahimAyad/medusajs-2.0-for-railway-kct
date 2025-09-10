// Quick build check script
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for common build issues...\n');

// 1. Check if all required env vars are documented
const envExample = fs.readFileSync('.env.example', 'utf8');
const requiredEnvVars = envExample.match(/NEXT_PUBLIC_\w+|REPLICATE_API_TOKEN/g) || [];

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(v => console.log(`  - ${v}`));

// 2. Check for problematic imports
console.log('\n🔍 Checking for potential import issues...');
const checkFiles = [
  'src/components/ui/micro-interactions.tsx',
  'src/app/api/voice-search/route.ts',
  'src/app/api/wedding-studio/generate/route.ts'
];

checkFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('canvas-confetti') && !content.includes("from 'canvas-confetti'")) {
      console.log(`⚠️  ${file} might have canvas-confetti import issues`);
    }
  }
});

// 3. Check package.json vs actual usage
console.log('\n📦 Verifying critical dependencies...');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const criticalDeps = ['canvas-confetti', '@types/canvas-confetti', 'replicate', 'framer-motion'];

criticalDeps.forEach(dep => {
  const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
  console.log(`  ${hasDep ? '✅' : '❌'} ${dep}`);
});

console.log('\n✅ Check complete!');