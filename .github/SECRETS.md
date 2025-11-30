# GitHub Secrets Configuration

This document explains the required GitHub secrets for the Azure deployment workflows.

## Required Secrets

### For Backend (`azure-deploy.yml` - matchnord-extranet)

1. **`DATABASE_URL`** (Required)
   - PostgreSQL connection string for the production database
   - Format: `postgresql://username:password@host:port/database?schema=public`
   - Example: `postgresql://matchnordadmin:YOUR_PASSWORD@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public`

2. **`NEXTAUTH_SECRET`** (Required)
   - Secret key for NextAuth.js session encryption
   - Generate with: `openssl rand -base64 32`
   - Must be at least 1 character long

3. **`NEXTAUTH_URL`** (Required)
   - The canonical URL of your site
   - Example: `https://matchnord.azurewebsites.net`

4. **`AZURE_WEBAPP_PUBLISH_PROFILE`** (Required)
   - Azure Web App publish profile for backend deployment
   - Get with: `az webapp deployment list-publishing-profiles --resource-group matchnord-rg --name matchnord --xml`
   - Copy the entire XML output
   - **Note:** This secret should already exist from the old repository

5. **`AZURE_STORAGE_ACCOUNT_NAME`** (Optional)
   - Azure Storage account name for file uploads
   - Example: `matchnordstorage`

6. **`AZURE_STORAGE_ACCOUNT_KEY`** (Optional)
   - Azure Storage account key
   - Get from Azure Portal or: `az storage account keys list --resource-group matchnord-rg --account-name matchnordstorage`

7. **`AZURE_STORAGE_CONTAINER_NAME`** (Optional)
   - Azure Storage container name for uploads
   - Example: `uploads`

### For Frontend (`azure-deploy-app.yml` - matchnord-app)

1. **`AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`** (Required)
   - Azure Web App publish profile for the frontend app
   - Get with: `az webapp deployment list-publishing-profiles --resource-group matchnord-rg --name matchnord-app --xml`
   - Copy the entire XML output
   - Note: This is a different publish profile than the backend!

2. **`NEXT_PUBLIC_API_URL`** (Optional, defaults to `https://matchnord.azurewebsites.net`)
   - The URL of the backend API
   - Example: `https://matchnord.azurewebsites.net`

## How to Set Secrets in GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## Getting Azure Publish Profiles

### Backend (matchnord)
```bash
az webapp deployment list-publishing-profiles \
  --resource-group matchnord-rg \
  --name matchnord \
  --xml > matchnord-publish-profile.xml
```

Then copy the contents of `matchnord-publish-profile.xml` and paste it as the `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

**Note:** If you're migrating from the old repository, this secret should already be configured.

### Frontend (matchnord-app)
```bash
az webapp deployment list-publishing-profiles \
  --resource-group matchnord-rg \
  --name matchnord-app \
  --xml > matchnord-app-publish-profile.xml
```

Then copy the contents of `matchnord-app-publish-profile.xml` and paste it as the `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND` secret.

## Verifying Secrets

After setting the secrets, you can verify the workflows will work by:

1. Checking the workflow logs - the validation step will fail early if required secrets are missing
2. Manually triggering a workflow run using `workflow_dispatch`

## Troubleshooting

### "Invalid environment variables" error
- Check that all required secrets are set
- Verify that `DATABASE_URL` and `NEXTAUTH_URL` are valid URLs
- Ensure `NEXTAUTH_SECRET` is not empty

### "No credentials found" error
- Verify that `AZURE_WEBAPP_PUBLISH_PROFILE` (for backend) or `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND` (for frontend) is set correctly
- Make sure you copied the entire XML content, including the `<publishData>` tags
- Check that the publish profile is for the correct web app

### Deployment fails
- Check Azure Web App logs: `az webapp log tail --resource-group matchnord-rg --name matchnord`
- Verify the web app exists and is running
- Check that the resource group and web app names match your Azure setup

