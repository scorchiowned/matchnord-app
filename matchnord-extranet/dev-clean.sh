#!/bin/bash

# Development script that cleans up existing processes and starts fresh

echo "🧹 Cleaning up existing development servers..."

# Kill any existing npm run dev processes
pkill -f "npm run dev" 2>/dev/null || echo "No npm run dev processes found"

# Kill any existing next dev processes  
pkill -f "next dev" 2>/dev/null || echo "No next dev processes found"

# Free up port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Port 3000 is free"

# Free up port 3002 (in case it was used)
lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "Port 3002 is free"

echo "✅ Cleanup complete"
echo "🚀 Starting development server on port 3000..."

# Start the development server
npm run dev
