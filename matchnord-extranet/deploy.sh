#!/bin/bash

# Azure deployment script - runs during deployment (not startup)
# This installs dependencies during deployment so startup is faster

echo "🔧 Azure Deployment Script"
echo "=========================="

cd /home/site/wwwroot || exit 1

echo "📦 Installing dependencies during deployment..."
if [ -f "package-lock.json" ]; then
    npm ci --legacy-peer-deps --production
else
    npm install --legacy-peer-deps --production
fi

echo "✅ Dependencies installed during deployment"




