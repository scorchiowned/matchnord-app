# Database Error Fix - OpenSSL Compatibility

## Problem

The application was experiencing Prisma database errors in the Docker container:

```
Unable to require(`/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node`).
The Prisma engines do not seem to be compatible with your system.
Details: Error loading shared library libssl.so.1.1: No such file or directory
```

## Root Cause

The issue was caused by:

1. **Missing OpenSSL 1.1.x library** in the Alpine Linux Docker container
2. **Incorrect Prisma binary targets** - the client was trying to use the wrong query engine for the Alpine environment

## Solution Applied

### 1. Updated Dockerfile

Added OpenSSL package for Prisma compatibility:

```dockerfile
# Use standard Alpine image
FROM node:18-alpine AS base

# In deps stage
RUN apk add --no-cache libc6-compat openssl

# In runner stage
RUN apk add --no-cache openssl
```

### 2. Updated Prisma Schema

Added explicit binary targets to ensure correct query engine selection:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

### 3. Created Fix Script

Added `fix-database-errors.sh` script to automate the rebuild process.

## How to Apply the Fix

1. **Run the fix script:**

   ```bash
   cd matchnord-extranet
   ./fix-database-errors.sh
   ```

2. **Or manually rebuild:**

   ```bash
   # Stop containers
   docker-compose down

   # Remove old image
   docker rmi tournament_software-matchnord_extranet

   # Regenerate Prisma client
   npx prisma generate

   # Rebuild and start
   docker-compose up --build -d
   ```

## Verification

After applying the fix, you should see:

- No more OpenSSL-related errors in the logs
- Successful database connections
- Prisma queries working properly

## Files Modified

- `Dockerfile` - Added OpenSSL 1.1 compatibility
- `prisma/schema.prisma` - Added binary targets
- `fix-database-errors.sh` - Created fix script
- `DATABASE_ERROR_FIX.md` - This documentation

## Technical Details

- **Base Image**: `node:18-alpine` (standard Alpine with OpenSSL 3.0)
- **OpenSSL Package**: `openssl` (provides OpenSSL 3.0)
- **Prisma Binary Target**: `linux-musl-openssl-3.0.x`
- **Compatibility**: Ensures Prisma query engine works with Alpine Linux + OpenSSL 3.0
- **Note**: Using OpenSSL 3.0 binary target which is compatible with modern Alpine
