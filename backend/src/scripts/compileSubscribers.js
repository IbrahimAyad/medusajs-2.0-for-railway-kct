const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Compiling TypeScript Subscribers ===');

const subscribersDir = path.join(__dirname, '..', 'subscribers');
// IMPORTANT: Keep JavaScript files in src/subscribers so Medusa can find them
const buildDir = path.join(__dirname, '..', 'subscribers');
// Also prepare for .medusa/server if it exists
const medusaBuildDir = path.join(process.cwd(), '.medusa', 'server', 'src', 'subscribers');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// List of new TypeScript subscribers (with .keep extension to prevent Medusa compilation)
const newSubscribers = [
  'auth-identity-created.ts.keep',
  'auth-password-registered.ts.keep',
  'customer-created.ts.keep'
];

// Convert TypeScript to JavaScript with proper ES6-style CommonJS exports
newSubscribers.forEach(file => {
  const sourcePath = path.join(subscribersDir, file);
  const destPath = path.join(buildDir, file.replace('.ts.keep', '.js'));

  if (fs.existsSync(sourcePath)) {
    console.log(`Processing ${file}...`);

    // Read the TypeScript file
    let content = fs.readFileSync(sourcePath, 'utf8');

    // Extract function name and config
    const functionMatch = content.match(/export\s+default\s+async\s+function\s+(\w+)/);
    // Handle multi-line config object
    const configMatch = content.match(/export\s+const\s+config\s*=\s*({[\s\S]*?^})/m);

    if (!functionMatch) {
      console.error(`Could not find exported function in ${file}`);
      return;
    }

    const functionName = functionMatch[1];
    let configContent = '{ event: "unknown" }';

    if (configMatch) {
      configContent = configMatch[1];
    } else {
      // Try to find inline event config
      const eventMatch = content.match(/event:\s*['"]([^'"]+)['"]/);
      if (eventMatch) {
        configContent = `{ event: "${eventMatch[1]}" }`;
      }
    }

    // Convert TypeScript to JavaScript
    content = content
      // Remove TypeScript type imports
      .replace(/import\s+type\s+{[^}]+}\s+from\s+['"][^'"]+['"];?/g, '')
      // Convert ES6 imports to CommonJS
      .replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g, 'const {$1} = require("$2");')
      .replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = require("$2");')
      // Remove type annotations
      .replace(/:\s*ICustomerModuleService/g, '')
      .replace(/:\s*SubscriberArgs<[^>]+>/g, '')
      .replace(/:\s*SubscriberConfig/g, '')
      .replace(/:\s*any/g, '')
      .replace(/:\s*string/g, '')
      .replace(/:\s*boolean/g, '')
      .replace(/:\s*void/g, '')
      // Remove export keywords but keep the function
      .replace(/export\s+default\s+async\s+function/, 'async function')
      .replace(/export\s+default\s+function/, 'function')
      // Remove export const config line
      .replace(/export\s+const\s+config\s*=\s*{[^}]+}/g, '');

    // Build the proper CommonJS module with ES6-style exports
    const compiledContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
${content}
exports.default = ${functionName};
exports.config = ${configContent};\n`;

    // Write the JavaScript file
    fs.writeFileSync(destPath, compiledContent);
    console.log(`✅ Compiled ${file} -> ${destPath}`);
  }
});

// Also copy existing JavaScript subscribers if they exist
const existingJsSubscribers = fs.readdirSync(subscribersDir)
  .filter(file => file.endsWith('.js'));

existingJsSubscribers.forEach(file => {
  const sourcePath = path.join(subscribersDir, file);
  const destPath = path.join(buildDir, file);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied existing ${file}`);
});

// Also copy to .medusa/server if it exists
if (fs.existsSync(medusaBuildDir)) {
  console.log('Copying compiled subscribers to .medusa/server...');
  const compiledFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'));

  compiledFiles.forEach(file => {
    const srcPath = path.join(buildDir, file);
    const destPath = path.join(medusaBuildDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`  Copied ${file}`);
  });
}

console.log('=== Subscriber Compilation Complete ===');
console.log('Generated files will use ES6-style CommonJS exports (exports.default and exports.config)');
console.log(`JavaScript files are in: ${buildDir}`);
console.log('These files will be loaded by Medusa during initialization.');