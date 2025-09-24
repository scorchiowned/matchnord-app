#!/bin/bash

# Setup production environment variables for Azure deployment

echo "🔧 Setting up production environment variables..."

# Set Azure database URL (you'll need to replace YOUR_PASSWORD with the actual password)
export DATABASE_URL="postgresql://matchnordadmin:YOUR_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres"

# Set NextAuth variables
export NEXTAUTH_SECRET="your-production-secret-here"
export NEXTAUTH_URL="https://matchnord.azurewebsites.net"

# Set Azure Storage variables
export AZURE_STORAGE_ACCOUNT_NAME="matchnordstorage"
export AZURE_STORAGE_ACCOUNT_KEY="YOUR_STORAGE_ACCOUNT_KEY_HERE"
export AZURE_STORAGE_CONTAINER_NAME="uploads"

echo "✅ Environment variables set!"
echo ""
echo "⚠️  IMPORTANT: You need to replace 'YOUR_PASSWORD' with your actual PostgreSQL password"
echo "⚠️  IMPORTANT: You need to set a strong NEXTAUTH_SECRET"
echo ""
echo "To set a strong NEXTAUTH_SECRET, run:"
echo "export NEXTAUTH_SECRET=\$(openssl rand -base64 32)"
echo ""
echo "Then run: npm run deploy"
