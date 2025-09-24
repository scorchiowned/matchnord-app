# 🚀 Local Azure Deployment Guide

This guide shows you how to deploy your MatchNord application to Azure locally, bypassing CI/CD issues.

## Prerequisites

1. **Azure CLI installed and logged in**

   ```bash
   az login
   az account show  # Verify you're logged in
   ```

2. **Environment variables set**
   ```bash
   export DATABASE_URL="postgresql://matchnordadmin:YOUR_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres"
   export NEXTAUTH_SECRET="your-secret-here"
   export NEXTAUTH_URL="https://matchnord.azurewebsites.net"
   export AZURE_STORAGE_ACCOUNT_KEY="your-storage-key"
   ```

## Deployment Methods

### Method 1: Full Deployment (Recommended)

```bash
npm run deploy
```

This runs the comprehensive deployment script that:

- ✅ Installs dependencies
- ✅ Generates Prisma client
- ✅ Runs database migrations
- ✅ Builds the application
- ✅ Creates deployment package
- ✅ Deploys to Azure
- ✅ Restarts the web app

### Method 2: Quick Deployment

```bash
npm run deploy:quick
```

This is a faster deployment for quick iterations:

- ✅ Builds the application
- ✅ Deploys to Azure

### Method 3: Manual Deployment

```bash
# Build the app
npm run build

# Deploy using Azure CLI
az webapp deployment source config-zip \
    --resource-group matchnord-rg \
    --name matchnord \
    --src .next
```

## Environment Variables

Make sure these are set in your shell or `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://matchnordadmin:YOUR_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://matchnord.azurewebsites.net"

# Azure Storage (for file uploads)
AZURE_STORAGE_ACCOUNT_NAME="matchnordstorage"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-key"
AZURE_STORAGE_CONTAINER_NAME="uploads"
```

## Troubleshooting

### Common Issues

1. **"Not logged in to Azure CLI"**

   ```bash
   az login
   ```

2. **"Environment variable not set"**

   ```bash
   export DATABASE_URL="your-database-url"
   export NEXTAUTH_SECRET="your-secret"
   export NEXTAUTH_URL="https://matchnord.azurewebsites.net"
   ```

3. **"Build failed"**

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   ```

4. **"Deployment failed"**
   ```bash
   az webapp restart --resource-group matchnord-rg --name matchnord
   ```

### Check Deployment Status

```bash
# Check web app status
az webapp show --resource-group matchnord-rg --name matchnord --query "state"

# Check deployment logs
az webapp log tail --resource-group matchnord-rg --name matchnord

# Check app URL
echo "https://matchnord.azurewebsites.net"
```

## Quick Commands

```bash
# Full deployment
npm run deploy

# Quick deployment
npm run deploy:quick

# Check status
az webapp show --resource-group matchnord-rg --name matchnord

# View logs
az webapp log tail --resource-group matchnord-rg --name matchnord

# Restart app
az webapp restart --resource-group matchnord-rg --name matchnord
```

## Your App URL

🌐 **https://matchnord.azurewebsites.net**

---

**Note**: The deployment scripts automatically handle Prisma migrations, so your database will be updated with each deployment.
