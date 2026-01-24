#!/bin/bash

# Database reset and migration script
# This script handles database operations separately from deployment

set -e

echo "🗄️  Database Management Script"
echo "=================================="
echo ""

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if we have the required password
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ POSTGRES_PASSWORD environment variable not set"
    echo "Please set it in your .env file or with: export POSTGRES_PASSWORD='your-postgres-password'"
    exit 1
fi

# Set production database URL
export DATABASE_URL="postgresql://matchnordadmin:$POSTGRES_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public"

echo "📍 Database: ${DATABASE_URL//:[^:@]*@/:****@}"
echo ""

# Check for reset flag
RESET_DB=false
if [[ "$1" == "--reset" ]] || [[ "$1" == "-r" ]]; then
    RESET_DB=true
fi

if [ "$RESET_DB" = true ]; then
    echo "🔄 RESET DATABASE MODE"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "⚠️  WARNING: This will DROP ALL TABLES and DELETE ALL DATA!"
    echo "   This action cannot be undone!"
    echo ""
    
    if [ -t 0 ]; then
        read -p "❓ Are you absolutely sure? Type 'RESET' to confirm: " CONFIRM_RESET
        if [ "$CONFIRM_RESET" != "RESET" ]; then
            echo "❌ Database reset cancelled"
            exit 0
        fi
    else
        echo "⚠️  Non-interactive mode: Proceeding with reset..."
    fi
    
    echo ""
    echo "🗑️  Dropping all tables and schema..."
    
    # Drop all tables individually first (more reliable than DROP SCHEMA)
    echo "   Step 1: Dropping all tables..."
    set +e
    DROP_TABLES=$(npx prisma db execute --stdin <<< "
    DO \$\$ 
    DECLARE 
        r RECORD;
    BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
        LOOP
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
    END \$\$;
    " 2>&1)
    
    # Drop the schema and recreate it
    echo "   Step 2: Dropping and recreating schema..."
    DROP_SCHEMA=$(npx prisma db execute --stdin <<< "
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO matchnordadmin;
    GRANT ALL ON SCHEMA public TO public;
    " 2>&1)
    
    # Verify schema is empty
    echo "   Step 3: Verifying schema is empty..."
    TABLE_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | grep -oE '[0-9]+' | head -1 || echo "1")
    
    set -e
    
    if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
        echo "✅ Schema reset successfully - all tables dropped"
    else
        echo "⚠️  Warning: Some tables may still exist (count: $TABLE_COUNT)"
        echo "   Attempting to continue with migrations..."
    fi
    
    echo ""
    echo "🔄 Running all migrations from scratch..."
    
    # First, check if there are any failed migrations and resolve them
    set +e
    FAILED_CHECK=$(npx prisma migrate status 2>&1)
    if echo "$FAILED_CHECK" | grep -q "Failed.*migration"; then
        echo "   Resolving any failed migrations first..."
        FAILED_MIG=$(echo "$FAILED_CHECK" | grep -E "Failed.*migration" | awk '{print $NF}' | head -1)
        if [ -n "$FAILED_MIG" ]; then
            echo "   Rolling back failed migration: $FAILED_MIG"
            npx prisma migrate resolve --rolled-back "$FAILED_MIG" 2>&1 | grep -v "NOTICE" || true
        fi
    fi
    set -e
    
    # Now run migrations
    set +e
    MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
    MIGRATE_EXIT=$?
    set -e
    
    if [ $MIGRATE_EXIT -eq 0 ]; then
        echo ""
        echo "✅ Database reset complete!"
        echo "   - All tables dropped"
        echo "   - Schema recreated"
        echo "   - All migrations applied"
        echo "   - Migration history created"
    else
        echo ""
        echo "❌ Migration failed during reset"
        echo ""
        echo "Error:"
        echo "$MIGRATE_OUTPUT" | tail -10
        echo ""
        
        # Check for specific error types
        if echo "$MIGRATE_OUTPUT" | grep -q "relation.*does not exist"; then
            echo "💡 Migration order issue detected!"
            echo "   A migration is trying to modify a table that doesn't exist yet."
            echo ""
            FAILED_MIG_NAME=$(echo "$MIGRATE_OUTPUT" | grep -oE "Migration name: [0-9_]+" | awk '{print $3}' || echo "")
            if [ -n "$FAILED_MIG_NAME" ]; then
                echo "   Failed migration: $FAILED_MIG_NAME"
                echo ""
                echo "   To fix:"
                echo "   1. Resolve the failed migration:"
                echo "      npx prisma migrate resolve --rolled-back $FAILED_MIG_NAME"
                echo "   2. Check migration order: ls -la prisma/migrations/ | sort"
                echo "   3. If needed, rename the migration folder to have a later timestamp"
                echo "   4. Then continue: npx prisma migrate deploy"
            fi
        fi
        
        exit 1
    fi
    
else
    # Normal migration mode - check status and apply migrations
    echo "📋 Checking migration status..."
    echo ""
    
    set +e
    MIGRATE_STATUS=$(npx prisma migrate status 2>&1)
    MIGRATE_STATUS_EXIT=$?
    echo "$MIGRATE_STATUS"
    echo ""
    set -e
    
    # Show pending migrations if any
    if echo "$MIGRATE_STATUS" | grep -q "following migrations have not yet been applied"; then
        echo "📝 Pending migrations:"
        echo "$MIGRATE_STATUS" | grep -A 100 "following migrations have not yet been applied" | grep -E "^[0-9]{14}" | while read -r line; do
            if [ -n "$line" ]; then
                echo "   - $line"
            fi
        done
        echo ""
        
        if [ -t 0 ]; then
            read -p "❓ Apply these migrations? (yes/no): " APPLY_MIGRATIONS
            if [ "$APPLY_MIGRATIONS" = "yes" ] || [ "$APPLY_MIGRATIONS" = "y" ] || [ "$APPLY_MIGRATIONS" = "Y" ]; then
                echo ""
                echo "🔄 Applying migrations..."
                set +e
                npx prisma migrate deploy
                MIGRATE_EXIT=$?
                set -e
                
                if [ $MIGRATE_EXIT -eq 0 ]; then
                    echo "✅ Migrations applied successfully"
                else
                    echo "❌ Migration failed. Check the error above."
                    exit 1
                fi
            else
                echo "❌ Migration cancelled"
            fi
        else
            echo "🔄 Applying migrations (non-interactive mode)..."
            npx prisma migrate deploy
        fi
        
    elif echo "$MIGRATE_STATUS" | grep -q "Database schema is up to date"; then
        echo "✅ Database schema is up to date - no migrations needed"
    else
        echo "⚠️  Could not determine migration status"
        echo "   Attempting to deploy migrations anyway..."
        set +e
        npx prisma migrate deploy
        MIGRATE_EXIT=$?
        set -e
        
        if [ $MIGRATE_EXIT -eq 0 ]; then
            echo "✅ Migrations applied successfully"
        else
            echo "❌ Migration failed. You may need to reset the database with --reset flag"
            exit 1
        fi
    fi
    
    # Show applied migrations
    echo ""
    echo "📊 Checking applied migrations in database..."
    set +e
    APPLIED_CHECK=$(npx prisma db execute --stdin <<< "SELECT migration_name, finished_at FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 10;" 2>&1)
    if echo "$APPLIED_CHECK" | grep -q "migration_name\|SELECT"; then
        echo "✅ Applied migrations:"
        echo "$APPLIED_CHECK" | grep -v "migration_name" | grep -v "---" | grep -v "^$" | head -10 | while read -r line; do
            if [ -n "$line" ] && ! echo "$line" | grep -q "error\|Error\|ERROR"; then
                echo "   - $line"
            fi
        done
    else
        echo "⚠️  Could not retrieve applied migrations"
    fi
    set -e
fi

echo ""
echo "✅ Database operation complete!"

