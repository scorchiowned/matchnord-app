#!/bin/bash

# Quick deployment script with environment setup
# Don't exit on error for migration checks - we want to continue even if migrations have issues
set -e

# Check for --force flag
FORCE_DEPLOY=false
if [[ "$1" == "--force" ]] || [[ "$1" == "-f" ]]; then
    FORCE_DEPLOY=true
    echo "⚡ Force mode enabled - skipping migration checks"
fi

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

# Run database migrations first (skip if force mode)
if [ "$FORCE_DEPLOY" = true ]; then
    echo "⚡ Force mode: Skipping migration checks"
    echo ""
else
    echo "🗄️ Running database migrations..."
    echo ""

    # First, check migration status to see if there are pending migrations
    echo "📋 Checking migration status..."
    set +e  # Temporarily disable exit on error for migration checks
    MIGRATE_STATUS=$(npx prisma migrate status 2>&1)
    MIGRATE_STATUS_EXIT=$?
    echo "$MIGRATE_STATUS"
    echo ""

    # Show pending migrations if any
    if echo "$MIGRATE_STATUS" | grep -q "following migrations have not yet been applied"; then
    echo "📝 Pending migrations that will be applied:"
    echo "$MIGRATE_STATUS" | grep -A 100 "following migrations have not yet been applied" | grep -E "^[0-9]{14}" | while read -r line; do
        if [ -n "$line" ]; then
            echo "   - $line"
        fi
    done
    echo ""
    fi

    # Check if _prisma_migrations table exists and show applied migrations
    echo "📊 Checking applied migrations in database..."
APPLIED_MIGRATIONS=$(npx prisma db execute --stdin <<< "SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 10;" 2>/dev/null || echo "")
if [ -n "$APPLIED_MIGRATIONS" ] && ! echo "$APPLIED_MIGRATIONS" | grep -q "error\|Error\|ERROR"; then
    echo "✅ Applied migrations in database:"
    echo "$APPLIED_MIGRATIONS" | grep -v "migration_name" | grep -v "---" | grep -v "^$" | while read -r line; do
        if [ -n "$line" ]; then
            echo "   - $line"
        fi
    done
else
        echo "⚠️  Could not retrieve applied migrations from database"
        echo "   This might mean the _prisma_migrations table doesn't exist yet"
    fi
    echo ""
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
        echo "⚠️  Database schema exists but migration history is missing (P3005)"
        echo ""
        echo "📋 This means the database was created manually or migration history was lost."
        echo "   The database has tables but Prisma doesn't know which migrations were applied."
        echo ""
        
        # Get list of pending migrations
        PENDING_MIGRATIONS=$(echo "$MIGRATE_STATUS" | grep -A 100 "following migrations have not yet been applied" | grep -E "^[0-9]{14}" | head -5)
        
        if [ -n "$PENDING_MIGRATIONS" ]; then
            echo "📝 Pending migrations that need to be resolved:"
            echo "$PENDING_MIGRATIONS" | while read -r line; do
                if [ -n "$line" ]; then
                    MIGRATION_NAME=$(echo "$line" | awk '{print $1}')
                    echo "   - $MIGRATION_NAME"
                fi
            done
            echo ""
            echo "💡 To baseline the database, run these commands:"
            echo "$PENDING_MIGRATIONS" | head -1 | while read -r line; do
                if [ -n "$line" ]; then
                    FIRST_MIG=$(echo "$line" | awk '{print $1}')
                    echo "   npx prisma migrate resolve --applied $FIRST_MIG"
                fi
            done
            echo "   (Then repeat for each migration, or if schema matches, mark all at once)"
        else
            echo "💡 To create migration history, you can:"
            echo "   1. Check existing migrations: ls prisma/migrations/"
            echo "   2. Mark them as applied if schema matches:"
            echo "      npx prisma migrate resolve --applied <migration_name>"
        fi
        echo ""
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
            echo "⚠️  Database schema exists but migration history is missing (P3005)"
            echo ""
            echo "📋 This means the database was created manually or migration history was lost."
            echo "   To fix this, you need to baseline the database:"
            echo ""
            echo "   Option 1: If the schema matches your migrations, mark all as applied:"
            echo "   npx prisma migrate resolve --applied <migration_name>"
            echo ""
            echo "   Option 2: Check which migrations exist in prisma/migrations:"
            echo "   ls -la prisma/migrations/"
            echo ""
            echo "   Option 3: Create a baseline migration:"
            echo "   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql"
            echo ""
            echo "⚠️  Continuing with deployment, but migrations need to be resolved manually"
        else
            echo "⚠️  Migration check completed with warnings, continuing deployment"
        fi
    fi
fi  # End of migration section (only runs if not force mode)

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

# Ask for confirmation before deploying
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚀 Ready to deploy to Azure"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📦 Deployment package created: deploy-package.zip"
echo "📊 Package size: $(du -h deploy-package.zip | cut -f1)"
echo ""
echo "🌐 Target: https://matchnord.azurewebsites.net"
echo "📋 Resource Group: matchnord-rg"
echo "🏷️  Web App: matchnord"
echo ""
if [ -t 0 ]; then
    # Interactive mode - ask for confirmation
    read -p "❓ Do you want to proceed with deployment? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ] && [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "❌ Deployment cancelled by user"
        echo "🧹 Cleaning up deployment files..."
        rm -rf deploy-temp
        rm -f deploy-package.zip
        exit 0
    fi
    echo ""
else
    # Non-interactive mode - proceed automatically
    echo "⚠️  Non-interactive mode: proceeding with deployment automatically"
    echo ""
fi

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
