const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  console.warn('Warning: .medusa/server directory not found. The Medusa build may have encountered issues.');
  // Don't throw error, just exit gracefully
  process.exit(0);
}

// Copy medusa-config.js to .medusa/server
const configPath = path.join(process.cwd(), 'medusa-config.js');
if (fs.existsSync(configPath)) {
  fs.copyFileSync(
    configPath,
    path.join(MEDUSA_SERVER_PATH, 'medusa-config.js')
  );
  console.log('Copied medusa-config.js to .medusa/server');
}

// Copy src/lib directory to .medusa/server/src/lib
const srcLibPath = path.join(process.cwd(), 'src', 'lib');
const destLibPath = path.join(MEDUSA_SERVER_PATH, 'src', 'lib');
if (fs.existsSync(srcLibPath)) {
  // Create src directory if it doesn't exist
  const destSrcPath = path.join(MEDUSA_SERVER_PATH, 'src');
  if (!fs.existsSync(destSrcPath)) {
    fs.mkdirSync(destSrcPath, { recursive: true });
  }
  // Copy lib directory recursively
  fs.cpSync(srcLibPath, destLibPath, { recursive: true });
  console.log('Copied src/lib to .medusa/server/src/lib');
}

// Copy pnpm-lock.yaml
fs.copyFileSync(
  path.join(process.cwd(), 'pnpm-lock.yaml'),
  path.join(MEDUSA_SERVER_PATH, 'pnpm-lock.yaml')
);

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
execSync('npm ci --omit=dev', { 
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});
