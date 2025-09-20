#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Copy medusa-config to .medusa/server if it exists
const medusaServerPath = path.join(process.cwd(), '.medusa', 'server');
const configPath = path.join(process.cwd(), 'medusa-config.js');

if (fs.existsSync(medusaServerPath) && fs.existsSync(configPath)) {
  console.log('Copying medusa-config.js to .medusa/server...');
  fs.copyFileSync(configPath, path.join(medusaServerPath, 'medusa-config.js'));
  
  // Also copy lib folder if it exists
  const libPath = path.join(process.cwd(), 'lib');
  if (fs.existsSync(libPath)) {
    const targetLibPath = path.join(medusaServerPath, 'lib');
    if (!fs.existsSync(targetLibPath)) {
      fs.mkdirSync(targetLibPath, { recursive: true });
    }
    // Copy constants.ts if it exists
    const constantsPath = path.join(libPath, 'constants.ts');
    if (fs.existsSync(constantsPath)) {
      fs.copyFileSync(constantsPath, path.join(targetLibPath, 'constants.ts'));
    }
  }
}

// Rest of the original init-backend script
console.log('Backend initialization completed');