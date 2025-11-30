# 🚀 MatchNord App (Public Frontend) - Deployment Guide

This guide explains how to deploy the `matchnord-app` public-facing frontend application to Azure.

## Overview

`matchnord-app` is the public-facing Next.js application that displays tournaments, matches, and allows team registration. It connects to the `matchnord-extranet` API backend.

## Prerequisites

1. **Azure CLI** installed and logged in
   ```bash
   az login
   az account show  # Verify you're logged in
   ```

2. **Azure Web App created** for the frontend
   - Resource Group: `matchnord-rg`
   - Web App Name: `matchnord-app` (or your chosen name)
   - Make sure the web app is configured for Node.js

3. **Backend API deployed**
   - The `matchnord-extranet` should be deployed and accessible at `https://matchnord.azurewebsites.net`

## Environment Variables

The app requires the following environment variable:

- `NEXT_PUBLIC_API_URL`: The URL of the matchnord-extranet API backend
  - Production: `https://matchnord.azurewebsites.net`
  - Development: `http://localhost:3000`

## Deployment

### Quick Deploy

```bash
cd matchnord-app
npm run deploy:now
```

This will:
- ✅ Build the application
- ✅ Create deployment package
- ✅ Deploy to Azure Web App
- ✅ Restart the web app

### Manual Deployment

1. **Set environment variable**:
   ```bash
   export NEXT_PUBLIC_API_URL="https://matchnord.azurewebsites.net"
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy using Azure CLI**:
   ```bash
   az webapp deployment source config-zip \
       --resource-group matchnord-rg \
       --name matchnord-app \
       --src deploy-package.zip
   ```

## Configuration

### Update Web App Name

If your Azure Web App has a different name, edit `deploy-now.sh`:

```bash
WEBAPP_NAME="your-webapp-name"
```

### Update API URL

If your backend API is at a different URL, edit `deploy-now.sh`:

```bash
API_URL="https://your-api-url.azurewebsites.net"
```

## Troubleshooting

### "Not logged in to Azure CLI"
```bash
az login
```

### "Web app not found"
Make sure the web app exists in Azure:
```bash
az webapp list --resource-group matchnord-rg
```

### "API connection errors"
Verify that:
1. The backend API is deployed and running
2. `NEXT_PUBLIC_API_URL` is set correctly
3. CORS is configured on the backend to allow requests from your frontend domain

### Check deployment status
```bash
az webapp show --resource-group matchnord-rg --name matchnord-app
```

### View logs
```bash
az webapp log tail --resource-group matchnord-rg --name matchnord-app
```

## Architecture

```
┌─────────────────────┐
│   matchnord-app     │  (Public Frontend)
│  (Next.js Frontend) │
│                     │
│  Port: 3001 (dev)   │
│  Azure Web App      │
└──────────┬──────────┘
           │
           │ API Calls
           │ (NEXT_PUBLIC_API_URL)
           │
┌──────────▼──────────┐
│ matchnord-extranet  │  (Backend API)
│  (Next.js Backend)  │
│                     │
│  Port: 3000 (dev)   │
│  Azure Web App      │
└─────────────────────┘
```

## Notes

- The frontend app runs independently from the backend
- Both apps can be deployed separately
- The frontend makes API calls to the backend using the `NEXT_PUBLIC_API_URL` environment variable
- In production, make sure CORS is properly configured on the backend to allow requests from your frontend domain

