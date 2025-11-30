#!/bin/bash

# Deployment script for matchnord-app (public frontend)
# This deploys the public-facing Next.js app to Azure
set -e

echo "🚀 MatchNord App (Public Frontend) - Deploy to Azure"
echo "===================================================="

# Configuration
RESOURCE_GROUP="matchnord-rg"
WEBAPP_NAME="matchnord-app"  # Change this if your Azure Web App has a different name
API_URL="https://matchnord.azurewebsites.net"  # URL of the matchnord-extranet API

# Check if Azure CLI is logged in
echo "🔐 Checking Azure CLI authentication..."
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure CLI. Please run 'az login' first."
    exit 1
fi
echo "✅ Azure CLI authenticated"

# Set production environment variables
echo "🔧 Setting up production environment..."
export NEXT_PUBLIC_API_URL="$API_URL"

echo "✅ Environment configured"
echo "   API URL: $NEXT_PUBLIC_API_URL"

# Build the application
echo "🏗️ Building application..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir deploy-temp

# Copy necessary files
cp -r .next deploy-temp/
cp -r public deploy-temp/
cp -r src deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/ 2>/dev/null || true
cp next.config.ts deploy-temp/
cp tailwind.config.ts deploy-temp/
cp tsconfig.json deploy-temp/
cp postcss.config.mjs deploy-temp/ 2>/dev/null || true

# Create .env.production with our variables
cat > deploy-temp/.env.production << EOF
NEXT_PUBLIC_API_URL="$API_URL"
EOF

# Create zip file
cd deploy-temp
zip -r ../deploy-package.zip . -x "*.DS_Store"
cd ..

# Deploy to Azure
echo "🚀 Deploying to Azure..."
if az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEBAPP_NAME \
    --src deploy-package.zip; then
    echo "✅ Deployment successful!"
    
    # Clean up deployment files
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-package.zip
    
    # Restart the web app
    echo "🔄 Restarting web app..."
    az webapp restart --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "🌐 Your app is available at: https://${WEBAPP_NAME}.azurewebsites.net"
    echo ""
    echo "📊 To check deployment status:"
    echo "   az webapp show --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME"
    echo ""
    echo "📋 To view logs:"
    echo "   az webapp log tail --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME"
else
    echo "❌ Deployment failed!"
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-package.zip
    exit 1
fi

