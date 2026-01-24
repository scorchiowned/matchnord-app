#!/bin/bash

# Script to run standalone build locally
# This loads environment variables and runs the standalone server

set -e

echo "🚀 Running Standalone Build Locally"
echo "===================================="

# Check if standalone build exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ Standalone build not found!"
    echo "   Please run 'npm run build' first to create the standalone build"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found!"
    echo "   Creating .env.local from env.example..."
    cp env.example .env.local
    echo "   ✅ Created .env.local"
    echo "   ⚠️  Please edit .env.local and set NEXTAUTH_SECRET before running again"
    exit 1
fi

# Load environment variables from .env.local
echo "📋 Loading environment variables from .env.local..."
# Use a safer method to load env vars (handles values with spaces and special chars)
set -a
source .env.local
set +a

# Verify required variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env.local"
    exit 1
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "❌ NEXTAUTH_SECRET is not set in .env.local"
    echo "   Please set it in .env.local (e.g., NEXTAUTH_SECRET=\"your-secret-key\")"
    exit 1
fi

if [ -z "$NEXTAUTH_URL" ]; then
    echo "❌ NEXTAUTH_URL is not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "   DATABASE_URL: ${DATABASE_URL//:[^:@]*@/:****@}"
echo "   NEXTAUTH_URL: $NEXTAUTH_URL"
echo ""

# Ensure project root has .next/static (Next.js may resolve paths relative to outputFileTracingRoot)
if [ ! -d ".next/static" ] && [ -d "build/static" ]; then
    echo "📋 Creating .next/static symlink/copy at project root..."
    mkdir -p .next
    cp -r build/static .next/static 2>/dev/null || ln -sf ../build/static .next/static 2>/dev/null || true
fi

# Change to standalone directory
cd .next/standalone

# Copy necessary files if they don't exist
# Always ensure .next/static exists (required for CSS and other static assets)
# Try copying from both .next/static and build/static (since distDir is 'build')
if [ ! -d ".next/static" ] || [ ! -d ".next/static/css" ]; then
    echo "📋 Copying .next/static directory to standalone..."
    mkdir -p .next
    # Try .next/static first, then build/static as fallback
    if [ -d "../../.next/static" ]; then
        cp -r ../../.next/static .next/static 2>/dev/null || true
    elif [ -d "../../build/static" ]; then
        cp -r ../../build/static .next/static 2>/dev/null || true
    fi
    if [ -d ".next/static/css" ]; then
        echo "   ✅ Static files copied successfully to standalone"
    else
        echo "   ⚠️  Warning: Static files may not have been copied correctly"
    fi
fi

# Copy server directory (needed for Next.js routing and static file serving)
if [ ! -d ".next/server" ]; then
    echo "📋 Copying .next/server directory..."
    mkdir -p .next
    cp -r ../../.next/server .next/server 2>/dev/null || cp -r ../../build/server .next/server 2>/dev/null || true
    if [ -d ".next/server" ]; then
        echo "   ✅ Server files copied successfully"
    else
        echo "   ⚠️  Warning: Server files may not have been copied correctly"
    fi
fi

# Copy build metadata files (BUILD_ID and manifests) - required for Next.js to recognize production build
if [ ! -f ".next/BUILD_ID" ]; then
    echo "📋 Copying build metadata files..."
    mkdir -p .next
    # Copy BUILD_ID and manifest files from build or .next directory
    if [ -f "../../build/BUILD_ID" ]; then
        cp ../../build/BUILD_ID .next/BUILD_ID 2>/dev/null || true
        cp ../../build/*.json .next/ 2>/dev/null || true
    elif [ -f "../../.next/BUILD_ID" ]; then
        cp ../../.next/BUILD_ID .next/BUILD_ID 2>/dev/null || true
        cp ../../.next/*.json .next/ 2>/dev/null || true
    fi
    if [ -f ".next/BUILD_ID" ]; then
        echo "   ✅ Build metadata files copied successfully"
    else
        echo "   ⚠️  Warning: Build metadata files may not have been copied correctly"
    fi
fi

if [ ! -d "public" ]; then
    echo "📋 Copying public directory..."
    cp -r ../../public . 2>/dev/null || true
fi

# Copy Prisma schema if needed
if [ ! -d "prisma" ]; then
    echo "📋 Copying Prisma schema..."
    mkdir -p prisma
    cp ../../prisma/schema.prisma prisma/ 2>/dev/null || true
fi

echo ""
echo "🌐 Starting standalone server..."
echo "   Server will be available at: ${NEXTAUTH_URL:-http://localhost:3000}"
echo ""

# Start the server
exec node server.js

