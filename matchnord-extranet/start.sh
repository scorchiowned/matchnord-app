#!/bin/bash

# Azure startup script for MatchNord
# This script runs database migrations before starting the Next.js app
# Optimized for standalone builds - no dependency installation needed!

echo "🚀 MatchNord Azure Startup Script v4 (Standalone)"
echo "=================================================="

# Ensure we're in the right directory
cd /home/site/wwwroot || exit 1

# Check if this is a standalone build (has server.js and node_modules)
if [ -f "server.js" ] && [ -d "node_modules" ]; then
    echo "✅ Standalone build detected - dependencies already included!"
    USE_STANDALONE=true
    export PATH="./node_modules/.bin:$PATH"
    
    # Verify Prisma CLI is available in standalone build
    if [ -f "node_modules/.bin/prisma" ]; then
        echo "   ✅ Prisma CLI found in standalone build"
    else
        echo "   ⚠️  Prisma CLI not found - checking node_modules structure..."
        ls -la node_modules/.bin/ | head -10 || echo "   .bin directory not found"
        echo "   ⚠️  This might mean Prisma needs to be moved to dependencies"
    fi
else
    echo "⚠️  Regular build detected - may need to install dependencies"
    USE_STANDALONE=false
fi

# Function to install dependencies
install_dependencies() {
    local ORIGINAL_DIR=$(pwd)
    echo "📦 Installing dependencies (this may take 2-5 minutes)..."
    
    # Determine writable directory
    WRITABLE_DIR=""
    if touch /home/site/wwwroot/test_write 2>/dev/null; then
        rm -f /home/site/wwwroot/test_write
        WRITABLE_DIR="/home/site/wwwroot"
        echo "   wwwroot is writable, installing there"
    elif [ -w "/home" ]; then
        WRITABLE_DIR="/home/site/deps"
        echo "   wwwroot is read-only, installing to $WRITABLE_DIR"
        mkdir -p "$WRITABLE_DIR"
        # Copy package files to writable location
        cp /home/site/wwwroot/package.json "$WRITABLE_DIR/"
        cp /home/site/wwwroot/package-lock.json "$WRITABLE_DIR/" 2>/dev/null || true
    else
        echo "❌ No writable directory found for node_modules"
        exit 1
    fi
    
    # Change to writable directory
    cd "$WRITABLE_DIR" || exit 1
    
    # Remove existing node_modules if it exists
    if [ -d "node_modules" ]; then
        echo "   Removing existing node_modules..."
        rm -rf node_modules
    fi
    
    # Install dependencies - use npm ci if package-lock.json exists, otherwise npm install
    echo "   Starting npm installation (this may take 2-5 minutes)..."
    set +e  # Don't exit on error for npm install
    
    # Run npm in background with progress monitoring
    if [ -f "package-lock.json" ]; then
        echo "   Using npm ci to install exact versions from package-lock.json..."
        # Start npm ci in background and monitor progress
        npm ci --legacy-peer-deps --loglevel=info > /tmp/npm_install.log 2>&1 &
        NPM_PID=$!
        
        # Show progress every 10 seconds
        COUNTER=0
        while kill -0 $NPM_PID 2>/dev/null; do
            sleep 10
            COUNTER=$((COUNTER + 10))
            echo "   ... still installing (${COUNTER}s elapsed) ..."
            # Show last few lines of progress
            tail -3 /tmp/npm_install.log 2>/dev/null | grep -v "^$" || true
        done
        
        wait $NPM_PID
        INSTALL_EXIT=$?
    else
        echo "   Using npm install (no package-lock.json found)..."
        npm install --legacy-peer-deps --loglevel=info > /tmp/npm_install.log 2>&1 &
        NPM_PID=$!
        
        COUNTER=0
        while kill -0 $NPM_PID 2>/dev/null; do
            sleep 10
            COUNTER=$((COUNTER + 10))
            echo "   ... still installing (${COUNTER}s elapsed) ..."
            tail -3 /tmp/npm_install.log 2>/dev/null | grep -v "^$" || true
        done
        
        wait $NPM_PID
        INSTALL_EXIT=$?
    fi
    
    echo ""
    echo "   npm installation completed with exit code: $INSTALL_EXIT"
    echo "   Last 20 lines of output:"
    tail -20 /tmp/npm_install.log 2>/dev/null || echo "   (no log available)"
    set -e  # Re-enable exit on error
    
    # Return to original directory
    cd "$ORIGINAL_DIR" || exit 1
    
    if [ $INSTALL_EXIT -ne 0 ]; then
        echo "❌ Dependency installation failed with exit code: $INSTALL_EXIT"
        echo "   Last 50 lines of npm output:"
        tail -50 /tmp/npm_install.log 2>/dev/null || echo "   (log file not available)"
        echo ""
        echo "   Trying alternative: npm install without --legacy-peer-deps..."
        npm install --progress=true 2>&1 | tail -30
        INSTALL_EXIT=$?
        if [ $INSTALL_EXIT -ne 0 ]; then
            echo "❌ Alternative installation also failed"
            echo "   This usually means there's a network issue or package.json problem"
            exit 1
        fi
    fi
    
    # Verify Prisma was installed
    if [ ! -f "node_modules/.bin/prisma" ]; then
        echo "⚠️  Prisma binary not found after installation, checking..."
        ls -la node_modules/.bin/ 2>/dev/null | head -10 || echo "   node_modules/.bin directory not found"
        # Try installing Prisma specifically
        echo "   Installing Prisma specifically..."
        npm install prisma@5.7.1 @prisma/client@5.7.1 --legacy-peer-deps --progress=true 2>&1 | tail -20
        if [ ! -f "node_modules/.bin/prisma" ]; then
            echo "❌ Prisma installation failed"
            exit 1
        fi
    fi
    
    # If we installed to a different directory, set NODE_PATH and PATH
    if [ "$WRITABLE_DIR" != "/home/site/wwwroot" ]; then
        echo "   Setting NODE_PATH and PATH to include dependencies..."
        export NODE_PATH="$WRITABLE_DIR/node_modules:$NODE_PATH"
        export PATH="$WRITABLE_DIR/node_modules/.bin:$PATH"
        
        # Make these environment variables persistent for the session
        echo "export NODE_PATH=\"$WRITABLE_DIR/node_modules:\$NODE_PATH\"" >> /tmp/env_setup.sh
        echo "export PATH=\"$WRITABLE_DIR/node_modules/.bin:\$PATH\"" >> /tmp/env_setup.sh
        
        # Try to create symlink (may fail if wwwroot is read-only, but NODE_PATH should work)
        if [ -w "/home/site/wwwroot" ]; then
            cd /home/site/wwwroot || exit 1
            rm -rf node_modules 2>/dev/null || true
            ln -sf "$WRITABLE_DIR/node_modules" node_modules 2>/dev/null || true
            cd "$ORIGINAL_DIR" || exit 1
            echo "   Created symlink from wwwroot to dependencies"
        else
            echo "   wwwroot is read-only - using NODE_PATH instead of symlink"
        fi
        # Store the writable directory for later use
        echo "$WRITABLE_DIR" > /tmp/deps_location.txt
    else
        export PATH="/home/site/wwwroot/node_modules/.bin:$PATH"
        echo "/home/site/wwwroot" > /tmp/deps_location.txt
    fi
    
    # Verify installation succeeded
    if [ -f "$WRITABLE_DIR/node_modules/.bin/prisma" ] && [ -f "$WRITABLE_DIR/node_modules/.bin/next" ]; then
        echo "✅ Dependencies installed successfully"
        echo "   Prisma: $WRITABLE_DIR/node_modules/.bin/prisma"
        echo "   Next.js: $WRITABLE_DIR/node_modules/.bin/next"
    else
        echo "⚠️  Installation completed but some binaries are missing"
        ls -la "$WRITABLE_DIR/node_modules/.bin/" | head -10 || echo "   .bin directory not found"
    fi
}

# Check dependencies - much simpler for standalone builds!
if [ "$USE_STANDALONE" = true ]; then
    echo "✅ Standalone build - dependencies already included!"
    PRISMA_BIN="./node_modules/.bin/prisma"
    echo "./" > /tmp/deps_location.txt
else
    echo "📦 Checking dependencies (non-standalone build)..."
    # Fallback to old logic for non-standalone builds
    if [ -d "node_modules" ] && [ -f "node_modules/.bin/prisma" ]; then
        echo "   ✅ Dependencies found"
        PRISMA_BIN="./node_modules/.bin/prisma"
        echo "./" > /tmp/deps_location.txt
    else
        echo "   ⚠️  Dependencies not found - this should not happen with standalone builds"
        echo "   ⚠️  Falling back to installation (this will be slow)..."
        install_dependencies
        if [ -f "/tmp/deps_location.txt" ]; then
            DEPS_LOC=$(cat /tmp/deps_location.txt)
            PRISMA_BIN="$DEPS_LOC/node_modules/.bin/prisma"
        else
            PRISMA_BIN="./node_modules/.bin/prisma"
        fi
    fi
fi

# Generate Prisma Client (should already be generated during build, but verify)
echo "🔧 Checking Prisma Client..."

# Ensure we're in wwwroot where schema.prisma is located
cd /home/site/wwwroot || exit 1

# Determine where Prisma CLI is installed
if [ "$USE_STANDALONE" = true ]; then
    PRISMA_BIN="./node_modules/.bin/prisma"
else
    if [ -f "/tmp/deps_location.txt" ]; then
        DEPS_LOCATION=$(cat /tmp/deps_location.txt)
        PRISMA_BIN="$DEPS_LOCATION/node_modules/.bin/prisma"
    else
        PRISMA_BIN="./node_modules/.bin/prisma"
    fi
fi

# Check if Prisma Client is already generated (should be if built correctly)
if [ -d "node_modules/.prisma/client" ] || [ -d "node_modules/@prisma/client" ]; then
    echo "   ✅ Prisma Client appears to be generated"
    # Still verify it works, but don't regenerate unless needed
    NEEDS_GENERATE=false
else
    echo "   ⚠️  Prisma Client not found - will generate"
    NEEDS_GENERATE=true
fi

# Verify Prisma CLI binary exists
if [ ! -f "$PRISMA_BIN" ]; then
    echo "   ❌ Prisma CLI binary not found at: $PRISMA_BIN"
    if [ "$USE_STANDALONE" = true ]; then
        echo "   ❌ Standalone build should include Prisma CLI"
        echo "   ⚠️  Falling back to dependency installation..."
        install_dependencies
        if [ -f "/tmp/deps_location.txt" ]; then
            DEPS_LOCATION=$(cat /tmp/deps_location.txt)
            PRISMA_BIN="$DEPS_LOCATION/node_modules/.bin/prisma"
        fi
    else
        install_dependencies
        if [ -f "/tmp/deps_location.txt" ]; then
            DEPS_LOCATION=$(cat /tmp/deps_location.txt)
            PRISMA_BIN="$DEPS_LOCATION/node_modules/.bin/prisma"
        fi
    fi
    
    if [ ! -f "$PRISMA_BIN" ]; then
        echo "   ❌ Prisma CLI still not found"
        exit 1
    fi
fi

# Generate Prisma Client if needed
if [ "$NEEDS_GENERATE" = true ]; then
    echo "   Generating Prisma Client..."
    set +e
    PRISMA_OUTPUT=$("$PRISMA_BIN" generate 2>&1)
    PRISMA_EXIT=$?
    set -e
    
    if [ $PRISMA_EXIT -eq 0 ]; then
        echo "✅ Prisma Client generated successfully"
    else
        echo "⚠️  Prisma generate had issues (exit code: $PRISMA_EXIT)"
        echo "$PRISMA_OUTPUT" | head -20
        echo "   Continuing anyway - Prisma Client might already be generated"
    fi
else
    echo "✅ Prisma Client already generated (included in build)"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
# Use local Prisma binary
if [ -f "$PRISMA_BIN" ]; then
    if "$PRISMA_BIN" migrate deploy; then
        echo "✅ Migrations applied successfully"
    else
        echo "⚠️  Migration command exited with an error"
        echo "   This might be normal if migrations are already applied or if there's a connection issue"
        echo "   Continuing with app startup..."
    fi
else
    echo "⚠️  Prisma binary not found, skipping migrations"
    echo "   Continuing with app startup..."
fi

# Start the Next.js application
echo "🌐 Starting Next.js application..."
if [ "$USE_STANDALONE" = true ]; then
    echo "   Using standalone server.js (fast startup!)"
    exec node server.js
else
    echo "   Using npm start (slower - requires node_modules)"
    exec npm run start
fi

