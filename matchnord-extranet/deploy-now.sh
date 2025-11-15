#!/bin/bash

# Quick deployment script with environment setup
set -e

echo "🚀 MatchNord Quick Deploy to Azure"
echo "=================================="

# Check if we have the required password
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ POSTGRES_PASSWORD environment variable not set"
    echo "Please set it with: export POSTGRES_PASSWORD='your-postgres-password'"
    echo ""
    echo "If you don't know your password, you can reset it with:"
    echo "az postgres flexible-server update --resource-group matchnord-rg --name matchnord-db --admin-password 'NEW_PASSWORD'"
    exit 1
fi

# Set production environment variables
echo "🔧 Setting up production environment..."
#export DATABASE_URL="postgresql://matchnordadmin:$POSTGRES_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres"
export DATABASE_URL="postgresql://matchnordadmin:$POSTGRES_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public"
#export DATABASE_URL="postgresql://matchnord-db.postgres.database.azure.com:5432/postgres?user=matchnordadmin&password=$POSTGRES_PASSWORD&sslmode=require"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://matchnord.azurewebsites.net"
export AZURE_STORAGE_ACCOUNT_NAME="matchnordstorage"
export AZURE_STORAGE_ACCOUNT_KEY="${AZURE_STORAGE_ACCOUNT_KEY:-YOUR_STORAGE_ACCOUNT_KEY_HERE}"
export AZURE_STORAGE_CONTAINER_NAME="uploads"

echo "✅ Environment configured"

# Run database migrations first
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

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
cp -r prisma deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp next.config.mjs deploy-temp/
cp tailwind.config.ts deploy-temp/
cp tsconfig.json deploy-temp/
cp postcss.config.js deploy-temp/ 2>/dev/null || true

# Create .env.production with our variables
cat > deploy-temp/.env.production << EOF
DATABASE_URL="$DATABASE_URL"
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="$NEXTAUTH_URL"
AZURE_STORAGE_ACCOUNT_NAME="$AZURE_STORAGE_ACCOUNT_NAME"
AZURE_STORAGE_ACCOUNT_KEY="$AZURE_STORAGE_ACCOUNT_KEY"
AZURE_STORAGE_CONTAINER_NAME="$AZURE_STORAGE_CONTAINER_NAME"
EOF

# Create zip file
cd deploy-temp
zip -r ../deploy-package.zip . -x "*.DS_Store"
cd ..

# Deploy to Azure
echo "🚀 Deploying to Azure..."
if az webapp deployment source config-zip \
    --resource-group matchnord-rg \
    --name matchnord \
    --src deploy-package.zip; then
    echo "✅ Deployment successful!"
    
    # Clean up deployment files
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-package.zip
    
    # Restart the web app
    echo "🔄 Restarting web app..."
    az webapp restart --resource-group matchnord-rg --name matchnord
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "🌐 Your app is available at: https://matchnord.azurewebsites.net"
    echo ""
    echo "📊 To check deployment status:"
    echo "   az webapp show --resource-group matchnord-rg --name matchnord"
    echo ""
    echo "📋 To view logs:"
    echo "   az webapp log tail --resource-group matchnord-rg --name matchnord"
else
    echo "❌ Deployment failed!"
    echo "🧹 Cleaning up deployment files..."
    rm -rf deploy-temp
    rm -f deploy-package.zip
    exit 1
fi
