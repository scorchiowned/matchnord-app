#!/bin/bash

# Quick deployment script with environment setup
# Don't exit on error for migration checks - we want to continue even if migrations have issues
set -e

echo "🚀 MatchNord Quick Deploy to Azure"
echo "=================================="

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if we have the required password
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ POSTGRES_PASSWORD environment variable not set"
    echo "Please set it in your .env file or with: export POSTGRES_PASSWORD='your-postgres-password'"
    echo ""
    echo "If you don't know your password, you can reset it with:"
    echo "az postgres flexible-server update --resource-group matchnord-rg --name matchnord-db --admin-password 'NEW_PASSWORD'"
    exit 1
fi


# Set production environment variables
echo "🔧 Setting up production environment..."
#export DATABASE_URL="postgresql://matchnordadmin:$POSTGRES_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres"
export DATABASE_URL="postgresql://matchnordadmin:$POSTGRES_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public"

echo "DATABASE_URL: $DATABASE_URL"
#export DATABASE_URL="postgresql://matchnord-db.postgres.database.azure.com:5432/postgres?user=matchnordadmin&password=$POSTGRES_PASSWORD&sslmode=require"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://matchnord.azurewebsites.net"
export AZURE_STORAGE_ACCOUNT_NAME="matchnordstorage"
export AZURE_STORAGE_ACCOUNT_KEY="${AZURE_STORAGE_ACCOUNT_KEY:-YOUR_STORAGE_ACCOUNT_KEY_HERE}"
export AZURE_STORAGE_CONTAINER_NAME="uploads"

echo "✅ Environment configured"

# Run database migrations first
echo "🗄️ Running database migrations..."

# First, check migration status to see if there are pending migrations
echo "📋 Checking migration status..."
set +e  # Temporarily disable exit on error for migration checks
MIGRATE_STATUS=$(npx prisma migrate status 2>&1)
MIGRATE_STATUS_EXIT=$?
echo "$MIGRATE_STATUS"
set -e  # Re-enable exit on error

# Check if there are pending migrations
if echo "$MIGRATE_STATUS" | grep -q "following migrations have not yet been applied"; then
    echo "🔄 Found pending migrations. Attempting to apply them..."
    
    # Try to deploy migrations (don't exit on error)
    set +e
    MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
    MIGRATE_EXIT_CODE=$?
    set -e
    
    if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
        echo "⚠️  Database schema exists but migration history is missing."
        echo "   This usually means the database was created manually."
        echo "   Attempting to resolve by marking migrations as applied..."
        
        # Get list of pending migrations
        PENDING_MIGRATIONS=$(echo "$MIGRATE_STATUS" | grep -A 100 "following migrations have not yet been applied" | grep -E "^[0-9]" | head -1 | awk '{print $1}')
        
        if [ -n "$PENDING_MIGRATIONS" ]; then
            echo "   First pending migration: $PENDING_MIGRATIONS"
            echo "   You may need to baseline the database manually with:"
            echo "   npx prisma migrate resolve --applied $PENDING_MIGRATIONS"
            echo "   Or mark all as applied if schema matches:"
            echo "   npx prisma migrate resolve --applied <migration_name>"
        fi
        
        echo "⚠️  Continuing deployment, but migrations need to be resolved manually"
    elif [ $MIGRATE_EXIT_CODE -eq 0 ]; then
        echo "✅ Migrations applied successfully"
    else
        echo "❌ Migration error occurred:"
        echo "$MIGRATE_OUTPUT"
        echo "⚠️  Continuing with deployment, but please check migration status manually"
    fi
elif echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is up to date - no migrations needed"
else
    # Try to deploy anyway in case status check didn't catch everything
    echo "🔄 Running migrate deploy to ensure all migrations are applied..."
    set +e
    MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
    MIGRATE_EXIT_CODE=$?
    set -e
    
    if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
        echo "✅ Migrations applied successfully"
    elif echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
        echo "⚠️  Database schema exists. If you have new migrations, resolve them manually."
    else
        echo "⚠️  Migration check completed with warnings, continuing deployment"
    fi
fi

# Build the application
echo "🏗️ Building application..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
rm -rf deploy-temp
mkdir deploy-temp

# Copy necessary files
cp -r .next deploy-temp/
[ -d public ] && cp -r public deploy-temp/ || echo "⚠️  public directory not found, skipping..."
cp -r src deploy-temp/
cp -r prisma deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp next.config.mjs deploy-temp/
cp tailwind.config.ts deploy-temp/
cp tsconfig.json deploy-temp/
cp postcss.config.js deploy-temp/ 2>/dev/null || true

# Copy production node_modules (required for Azure runtime)
echo "📦 Copying production dependencies..."
if [ -d node_modules ]; then
    echo "   Copying node_modules (this may take a moment)..."
    # Use rsync if available for better performance, otherwise use cp
    if command -v rsync > /dev/null 2>&1; then
        rsync -a --exclude='.cache' --exclude='*.ts' --exclude='*.tsx' --exclude='test' --exclude='tests' --exclude='__tests__' --exclude='*.test.*' --exclude='*.spec.*' --exclude='*.map' node_modules/ deploy-temp/node_modules/ 2>/dev/null || cp -r node_modules deploy-temp/ 2>/dev/null
    else
        cp -r node_modules deploy-temp/ 2>/dev/null
    fi
    echo "   ✅ node_modules copied"
else
    echo "   ⚠️  node_modules not found locally"
    echo "   ℹ️  Azure will attempt to install dependencies during deployment"
fi

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

# Ensure Azure installs dependencies during deployment
echo "⚙️  Configuring Azure to install dependencies..."
az webapp config appsettings set \
    --resource-group matchnord-rg \
    --name matchnord \
    --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    --output none 2>/dev/null || echo "⚠️  Could not set SCM_DO_BUILD_DURING_DEPLOYMENT (may already be set)"

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
