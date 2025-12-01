#!/bin/bash

set -e

echo "🚀 Creating deployment package for Azure..."

# Generate Prisma client with correct binary targets
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Build the application first
echo "📦 Building Next.js application..."
npm run build

# Create deployment package directory
echo "📁 Creating deployment package structure..."
rm -rf deploy-package
mkdir -p deploy-package

# Copy standalone output (contains server.js and node_modules)
echo "📋 Copying standalone output..."
cp -r .next/standalone/* deploy-package/

# Ensure .next directory exists and copy necessary files
mkdir -p deploy-package/.next
cp -r .next/static deploy-package/.next/static

# Copy entire server directory from source
echo "📋 Copying server directory..."
rm -rf deploy-package/.next/server
cp -r .next/server deploy-package/.next/server

# Copy all manifest files required by Next.js standalone
echo "📋 Copying manifest files..."
cp .next/BUILD_ID deploy-package/.next/BUILD_ID 2>/dev/null || echo "BUILD_ID not found"
cp .next/routes-manifest.json deploy-package/.next/routes-manifest.json 2>/dev/null || echo "routes-manifest.json not found"
cp .next/prerender-manifest.json deploy-package/.next/prerender-manifest.json 2>/dev/null || echo "prerender-manifest.json not found"
cp .next/prerender-manifest.js deploy-package/.next/prerender-manifest.js 2>/dev/null || echo "prerender-manifest.js not found"
cp .next/images-manifest.json deploy-package/.next/images-manifest.json 2>/dev/null || echo "images-manifest.json not found"
cp .next/build-manifest.json deploy-package/.next/build-manifest.json 2>/dev/null || echo "build-manifest.json not found"
cp .next/app-build-manifest.json deploy-package/.next/app-build-manifest.json 2>/dev/null || echo "app-build-manifest.json not found"
cp .next/react-loadable-manifest.json deploy-package/.next/react-loadable-manifest.json 2>/dev/null || echo "react-loadable-manifest.json not found"

# Copy middleware file (required for routing)
cp middleware.ts deploy-package/middleware.ts 2>/dev/null || echo "middleware.ts not found"

# Copy public folder if it exists
[ -d "public" ] && cp -r public deploy-package/ || echo "No public directory found, skipping"

# Copy Prisma files for migrations
cp -r prisma deploy-package/

# Copy package.json and update start script for standalone
cp package.json deploy-package/
# Update start script to use node server.js for standalone output
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('deploy-package/package.json')); pkg.scripts.start='node server.js'; fs.writeFileSync('deploy-package/package.json', JSON.stringify(pkg, null, 2));"
cp package-lock.json deploy-package/ 2>/dev/null || true

# Verify server.js exists
if [ ! -f "deploy-package/server.js" ]; then
  echo "❌ Error: server.js not found in deploy-package"
  exit 1
fi

# Verify BUILD_ID exists
if [ ! -f "deploy-package/.next/BUILD_ID" ]; then
  echo "⚠️ Warning: BUILD_ID not found, but continuing..."
fi

# Verify pages-manifest.json exists
if [ ! -f "deploy-package/.next/server/pages-manifest.json" ]; then
  echo "❌ Error: pages-manifest.json not found in deploy-package/.next/server/"
  exit 1
fi

echo "✅ Verified pages-manifest.json exists"

# Create zip file for deployment
echo "📦 Creating zip file..."
cd deploy-package
zip -r ../app.zip . -x "*.DS_Store"
cd ..

echo "✅ Deployment package created successfully: app.zip"
echo "📦 Package size: $(du -h app.zip | cut -f1)"
echo ""
echo "🚀 To deploy, run:"
echo "   az webapp deploy --resource-group matchnord-rg --name matchnord --src-path app.zip --type zip"

