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

// Copy JavaScript subscribers that were compiled BEFORE medusa build
// These are needed in .medusa/server for production runtime
const subscriberSrcPath = path.join(process.cwd(), 'src', 'subscribers');
const subscriberDestPath = path.join(MEDUSA_SERVER_PATH, 'src', 'subscribers');
if (fs.existsSync(subscriberSrcPath)) {
  // Create src directory if it doesn't exist
  const destSrcPath = path.join(MEDUSA_SERVER_PATH, 'src');
  if (!fs.existsSync(destSrcPath)) {
    fs.mkdirSync(destSrcPath, { recursive: true });
  }
  // Create subscribers directory
  if (!fs.existsSync(subscriberDestPath)) {
    fs.mkdirSync(subscriberDestPath, { recursive: true });
  }

  // Copy ONLY the three specific JavaScript files we compiled for auth
  // Skip TypeScript files and other JS files to avoid conflicts
  const authSubscribers = [
    'auth-identity-created.js',
    'auth-password-registered.js',
    'customer-created.js'
  ];

  authSubscribers.forEach(file => {
    const srcFile = path.join(subscriberSrcPath, file);
    const destFile = path.join(subscriberDestPath, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
    }
  });

  console.log('Copied subscribers to .medusa/server/src/subscribers');

  // Verify the compiled files exist
  if (fs.existsSync(subscriberDestPath)) {
    const copiedFiles = fs.readdirSync(subscriberDestPath);
    console.log(`Subscriber files (JS):`, copiedFiles.filter(f => f.endsWith('.js')));
    console.log(`Subscriber files (TS):`, copiedFiles.filter(f => f.endsWith('.ts')));
    console.log('IMPORTANT: JavaScript files in src/subscribers will be loaded by Medusa');
  }
}

// Copy src/api directory to .medusa/server/src/api - CRITICAL FOR HEALTH ENDPOINT
const srcApiPath = path.join(process.cwd(), 'src', 'api');
const destApiPath = path.join(MEDUSA_SERVER_PATH, 'src', 'api');
if (fs.existsSync(srcApiPath)) {
  // Create src directory if it doesn't exist
  const destSrcPath = path.join(MEDUSA_SERVER_PATH, 'src');
  if (!fs.existsSync(destSrcPath)) {
    fs.mkdirSync(destSrcPath, { recursive: true });
  }
  // Copy api directory recursively
  fs.cpSync(srcApiPath, destApiPath, { recursive: true });
  console.log('Copied src/api to .medusa/server/src/api - Including health endpoint');
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

// Check if pnpm is available, otherwise fall back to npm
try {
  execSync('which pnpm', { stdio: 'ignore' });
  // pnpm is available
  execSync('pnpm install --prod --frozen-lockfile', { 
    cwd: MEDUSA_SERVER_PATH,
    stdio: 'inherit'
  });
} catch (e) {
  // pnpm not available, check for package-lock.json or skip
  const packageLockPath = path.join(MEDUSA_SERVER_PATH, 'package-lock.json');
  const npmLockPath = path.join(process.cwd(), 'package-lock.json');
  
  if (fs.existsSync(npmLockPath)) {
    // Copy package-lock.json if it exists
    fs.copyFileSync(npmLockPath, packageLockPath);
    execSync('npm ci --omit=dev', {
      cwd: MEDUSA_SERVER_PATH,
      stdio: 'inherit'
    });
  } else {
    // No lock file, skip dependency installation in build
    console.log('No lock file found, skipping dependency installation in .medusa/server');
    console.log('Dependencies will be handled by the main node_modules');
  }
}
