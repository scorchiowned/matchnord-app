#!/bin/bash

# Script to fix Prisma database errors in Docker container
# This script rebuilds the Docker container with proper OpenSSL support

echo "🔧 Fixing Prisma database errors..."

# Stop any running containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove the existing image to force a rebuild
echo "🗑️  Removing existing Docker image..."
docker rmi tournament_software-matchnord_extranet 2>/dev/null || true

# Also remove any dangling images
echo "🧹 Cleaning up Docker images..."
docker image prune -f

# Rebuild the Prisma client with new binary targets
echo "🔄 Regenerating Prisma client..."
cd matchnord-extranet
npx prisma generate

# Go back to root directory
cd ..

# Rebuild and start the containers
echo "🏗️  Rebuilding and starting containers..."
docker-compose up --build -d

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if the container is running properly
echo "🔍 Checking container status..."
docker-compose ps

# Show logs to verify the fix
echo "📋 Recent logs from matchnord_extranet:"
docker-compose logs --tail=20 matchnord_extranet

echo "✅ Database error fix complete!"
echo "💡 If you still see errors, check the logs with: docker-compose logs -f matchnord_extranet"
