#!/usr/bin/env node

/**
 * This script ensures subscriber TypeScript files are present and valid
 * BEFORE Medusa build runs. This is critical for production deployment.
 */

const fs = require('fs');
const path = require('path');

const subscribersDir = path.join(__dirname, '..', 'subscribers');

console.log('=== Ensuring Subscribers are Ready for Build ===');
console.log('Checking:', subscribersDir);

// Check if directory exists
if (!fs.existsSync(subscribersDir)) {
  console.error('ERROR: src/subscribers directory does not exist!');
  process.exit(1);
}

// List all TypeScript files
const tsFiles = fs.readdirSync(subscribersDir)
  .filter(file => file.endsWith('.ts'));

console.log('Found TypeScript subscribers:', tsFiles);

// Critical subscribers that MUST exist
const requiredSubscribers = [
  'auth-identity-created.ts',
  'customer-created.ts'
];

// Check each required subscriber
for (const subscriber of requiredSubscribers) {
  const filePath = path.join(subscribersDir, subscriber);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: Required subscriber missing: ${subscriber}`);
    process.exit(1);
  }

  // Verify file has content
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('export default') || !content.includes('export const config')) {
    console.error(`ERROR: ${subscriber} is missing required exports`);
    process.exit(1);
  }

  console.log(`✅ ${subscriber} - Valid`);
}

console.log('=== All Subscribers Ready for Build ===');