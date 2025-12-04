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

echo ""
echo "📋 Deployment Configuration:"
echo "   Target Web App: ${WEBAPP_NAME}"
echo "   Target URL: https://${WEBAPP_NAME}.azurewebsites.net"
echo "   Backend API: ${API_URL}"
echo ""

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
echo "   Deployment Target: https://${WEBAPP_NAME}.azurewebsites.net"
echo "   Backend API URL: $NEXT_PUBLIC_API_URL"

# Build the application
echo "🏗️ Building application..."
npm run build

# Verify standalone output exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Standalone output not found. Make sure next.config.ts has 'output: \"standalone\"'"
    exit 1
fi

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir deploy-temp

# Copy standalone output (includes all necessary dependencies)
echo "📋 Copying standalone build..."
cp -r .next/standalone/* deploy-temp/
cp -r .next/standalone/.[!.]* deploy-temp/ 2>/dev/null || true

# Copy static files (standalone output needs these at the root level)
echo "📋 Copying static files..."
if [ -d ".next/static" ]; then
    mkdir -p deploy-temp/.next
    cp -r .next/static deploy-temp/.next/static
fi

# Copy public folder if it exists
if [ -d "public" ]; then
    cp -r public deploy-temp/public
fi

# Create .env.production with our variables
cat > deploy-temp/.env.production << EOF
NEXT_PUBLIC_API_URL="$API_URL"
PORT=8080
HOSTNAME="0.0.0.0"
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
    
    # Configure Azure App Service to use the standalone server
    echo "⚙️ Configuring Azure App Service..."
    # For Linux App Service, set startup command via app settings
    az webapp config set \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --startup-file "node server.js" \
        --always-on true \
        --output none
    
    # Set environment variables
    echo "🔧 Setting environment variables..."
    az webapp config appsettings set \
        --resource-group $RESOURCE_GROUP \
        --name $WEBAPP_NAME \
        --settings \
        NEXT_PUBLIC_API_URL="$API_URL" \
        PORT=8080 \
        HOSTNAME="0.0.0.0" \
        NODE_ENV=production \
        --output none
    
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

