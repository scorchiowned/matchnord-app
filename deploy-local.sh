#!/bin/bash

# Local Azure Deployment Script for MatchNord
# This script builds and deploys the application to Azure Web App

set -e  # Exit on any error

echo "🚀 Starting local deployment to Azure..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="matchnord-rg"
WEBAPP_NAME="matchnord"
LOCATION="North Europe"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Web App: $WEBAPP_NAME"
echo "  Location: $LOCATION"
echo ""

# Check if Azure CLI is logged in
echo -e "${YELLOW}🔐 Checking Azure CLI authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Azure CLI. Please run 'az login' first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Azure CLI authenticated${NC}"

# Check if required environment variables are set
echo -e "${YELLOW}🔍 Checking environment variables...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is not set${NC}"
    echo "Please set it with: export DATABASE_URL='postgresql://matchnordadmin:YOUR_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres'"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo -e "${RED}❌ NEXTAUTH_SECRET environment variable is not set${NC}"
    echo "Please set it with: export NEXTAUTH_SECRET='your-secret'"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo -e "${RED}❌ NEXTAUTH_URL environment variable is not set${NC}"
    echo "Please set it with: export NEXTAUTH_URL='https://matchnord.azurewebsites.net'"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Generate Prisma client
echo -e "${YELLOW}🗄️ Generating Prisma client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Run database migrations
echo -e "${YELLOW}🔄 Running database migrations...${NC}"
npx prisma migrate deploy || echo -e "${YELLOW}⚠️ No migrations to run or migration failed${NC}"

# Build the application
echo -e "${YELLOW}🏗️ Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Application built successfully${NC}"

# Create deployment package
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
if [ -d "deploy-package" ]; then
    rm -rf deploy-package
fi

mkdir deploy-package

# Copy necessary files
cp -r .next deploy-package/
cp -r public deploy-package/
cp -r src deploy-package/
cp -r prisma deploy-package/
cp package.json deploy-package/
cp package-lock.json deploy-package/
cp next.config.mjs deploy-package/
cp tailwind.config.ts deploy-package/
cp tsconfig.json deploy-package/
cp postcss.config.js deploy-package/ 2>/dev/null || true
cp .env.local deploy-package/.env.local 2>/dev/null || true

echo -e "${GREEN}✅ Deployment package created${NC}"

# Create zip file
echo -e "${YELLOW}📦 Creating deployment package...${NC}"
cd deploy-package
zip -r ../deploy-package.zip . -x "*.DS_Store" "node_modules/*"
cd ..

# Deploy to Azure
echo -e "${YELLOW}🚀 Deploying to Azure Web App...${NC}"
if az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $WEBAPP_NAME \
    --src deploy-package.zip; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Clean up deployment files
    echo -e "${YELLOW}🧹 Cleaning up deployment files...${NC}"
    rm -rf deploy-package
    rm -f deploy-package.zip
    
    # Get deployment status
    echo -e "${YELLOW}📊 Checking deployment status...${NC}"
    az webapp show --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME --query "state" --output tsv

    echo -e "${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${BLUE}🌐 Your app is available at: https://matchnord.azurewebsites.net${NC}"

    # Optional: Restart the web app to ensure clean deployment
    echo -e "${YELLOW}🔄 Restarting web app...${NC}"
    az webapp restart --resource-group $RESOURCE_GROUP --name $WEBAPP_NAME

    echo -e "${GREEN}✅ Web app restarted${NC}"
    echo -e "${BLUE}🎯 Deployment complete! Check your app at https://matchnord.azurewebsites.net${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${YELLOW}🧹 Cleaning up deployment files...${NC}"
    rm -rf deploy-package
    rm -f deploy-package.zip
    exit 1
fi
