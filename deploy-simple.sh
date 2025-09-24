#!/bin/bash

# Simple Azure Deployment Script
set -e

echo "🚀 Quick deploy to Azure..."

# Build
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir deploy-temp

# Copy necessary files
cp -r .next deploy-temp/
cp -r public deploy-temp/
cp -r src deploy-temp/
cp -r prisma deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp next.config.mjs deploy-temp/
cp tailwind.config.ts deploy-temp/
cp tsconfig.json deploy-temp/
cp postcss.config.js deploy-temp/ 2>/dev/null || true

# Create zip file
cd deploy-temp
zip -r ../deploy-simple.zip . -x "*.DS_Store"
cd ..

# Deploy using Azure CLI
if az webapp deployment source config-zip \
    --resource-group matchnord-rg \
    --name matchnord \
    --src deploy-simple.zip; then
    echo "✅ Deployment successful!"
    
    # Clean up deployment files
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-simple.zip
    
    echo "✅ Deployed! Check: https://matchnord.azurewebsites.net"
else
    echo "❌ Deployment failed!"
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-simple.zip
    exit 1
fi
