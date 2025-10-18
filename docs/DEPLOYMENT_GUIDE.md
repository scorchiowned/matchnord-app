# MatchNord Deployment Guide

This guide explains how to deploy the MatchNord tournament management application to Azure.

## Prerequisites

1. **Azure CLI** installed and configured
2. **Node.js 18.x** installed
3. **PostgreSQL password** for the Azure database
4. **Azure Storage Account** credentials

## Environment Setup

Before deploying, set up the required environment variables:

```bash
# Required environment variables
export POSTGRES_PASSWORD="your-postgres-password"
export NEXTAUTH_SECRET="$(openssl rand -base64 32)"
export NEXTAUTH_URL="https://matchnord.azurewebsites.net"
export AZURE_STORAGE_ACCOUNT_NAME="matchnordstorage"
export AZURE_STORAGE_ACCOUNT_KEY="your-storage-account-key"
export AZURE_STORAGE_CONTAINER_NAME="uploads"
```

## Deployment Methods

### 1. Quick Deploy (Recommended)

The simplest way to deploy:

```bash
npm run deploy:now
```

This script will:

- Set up environment variables
- Run database migrations
- Build the application
- Create deployment package
- Deploy to Azure
- Clean up deployment files (zip files and temp directories)
- Restart the web app

### 2. Simple Deploy

For a basic deployment without environment setup:

```bash
npm run deploy:quick
```

### 3. Full Deploy

For a complete deployment with all options:

```bash
npm run deploy
```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Set environment variables** (see above)

2. **Run database migrations**:

   ```bash
   npx prisma migrate deploy
   ```

3. **Build the application**:

   ```bash
   npm run build
   ```

4. **Create deployment package**:

   ```bash
   # Create temporary directory
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
   cp postcss.config.js deploy-temp/

   # Create zip file
   cd deploy-temp
   zip -r ../deploy-package.zip . -x "*.DS_Store"
   cd ..
   ```

5. **Deploy to Azure**:

   ```bash
   az webapp deployment source config-zip \
       --resource-group matchnord-rg \
       --name matchnord \
       --src deploy-package.zip
   ```

6. **Clean up**:
   ```bash
   rm -rf deploy-temp
   rm -f deploy-package.zip
   ```

## Important Notes

### Package.json Dependencies

The `package.json` file includes the following dependencies in the `dependencies` section (not `devDependencies`) for Azure deployment:

- `autoprefixer`: Required for PostCSS processing
- `postcss`: Required for CSS processing
- `tailwindcss`: Required for Tailwind CSS

### Automatic Cleanup

All deployment scripts automatically clean up temporary files after deployment:

- **Success**: Removes zip files and temporary directories
- **Failure**: Also cleans up files and exits with error code
- **No manual cleanup needed**: Scripts handle everything automatically

### Azure Configuration

The Azure Web App is configured with:

- **SCM_DO_BUILD_DURING_DEPLOYMENT=true**: Enables automatic dependency installation
- **Node.js 18.x**: Runtime version
- **PostgreSQL database**: Connected via DATABASE_URL

### Database Connection

The application connects to Azure PostgreSQL using:

```
postgresql://matchnordadmin:PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public
```

## Troubleshooting

### Common Issues

1. **"Cannot find module 'autoprefixer'"**
   - Solution: Ensure `autoprefixer` and `postcss` are in `dependencies` section of `package.json`

2. **"next: not found"**
   - Solution: Ensure `SCM_DO_BUILD_DURING_DEPLOYMENT=true` is set in Azure App Service settings

3. **Database connection errors**
   - Solution: Verify DATABASE_URL format and credentials

4. **Build failures**
   - Solution: Check that all required files are included in deployment package

### Checking Deployment Status

```bash
# Check web app status
az webapp show --resource-group matchnord-rg --name matchnord

# View logs
az webapp log tail --resource-group matchnord-rg --name matchnord

# Download logs
az webapp log download --resource-group matchnord-rg --name matchnord --log-file logs.zip
```

### Restarting the Application

```bash
az webapp restart --resource-group matchnord-rg --name matchnord
```

## Production URL

After successful deployment, the application will be available at:
**https://matchnord.azurewebsites.net**

## CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/azure-deploy.yml`) for automatic deployment on push to main branch.

Required GitHub Secrets:

- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_ACCOUNT_KEY`
- `AZURE_STORAGE_CONTAINER_NAME`
