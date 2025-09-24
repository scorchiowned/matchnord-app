# Azure Deployment Setup

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### 1. Azure Web App Publish Profile

```bash
# Get the publish profile
az webapp deployment list-publishing-profiles --name matchnord --resource-group matchnord-rg --xml
```

Copy the entire XML output and add it as `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

### 2. Database Connection

```bash
# Get the database connection string
az postgres flexible-server show-connection-string --name matchnord-db --admin-user matchnord_admin --admin-password <your-password> --database-name matchnord
```

Add as `DATABASE_URL` secret.

### 3. Authentication Secrets

- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Set to your Azure App Service URL (e.g., `https://matchnord.azurewebsites.net`)

### 4. Storage Account

```bash
# Get storage account key
az storage account keys list --account-name matchnordstorage --resource-group matchnord-rg --query "[0].value" -o tsv
```

Add as `AZURE_STORAGE_ACCOUNT_KEY` secret.

Also add:

- `AZURE_STORAGE_ACCOUNT_NAME`: `matchnordstorage`
- `AZURE_STORAGE_CONTAINER_NAME`: `uploads` (or create a container)

### 5. Database Migrations

The database migrations will run automatically using the `DATABASE_URL` secret, so no additional password is needed.

## How to Add Secrets in GitHub

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name and value

## Environment Variables in Azure App Service

You also need to set these as environment variables in your Azure App Service:

1. Go to Azure Portal
2. Navigate to your App Service (matchnord)
3. Go to "Configuration" → "Application settings"
4. Add the following:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `AZURE_STORAGE_ACCOUNT_NAME`
   - `AZURE_STORAGE_ACCOUNT_KEY`
   - `AZURE_STORAGE_CONTAINER_NAME`
