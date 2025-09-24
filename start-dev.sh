#!/bin/bash

# MatchNord Development Startup Script

echo "🚀 Starting MatchNord Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL database
echo "📊 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
while ! docker-compose exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done

echo "✅ Database is ready!"

# Check if we should run migrations
if [ "$1" = "--migrate" ]; then
    echo "🔄 Running database migrations..."
    cd matchnord-extranet
    npm run prisma:migrate
    npm run prisma:seed
    cd ..
fi

# Start the applications
echo "🌐 Starting MatchNord Extranet (Backend)..."
cd matchnord-extranet
npm run dev &
EXTRANET_PID=$!

echo "📱 Starting MatchNord App (Frontend)..."
cd ../matchnord-app
npm run dev &
APP_PID=$!

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Services:"
echo "   • Database:     http://localhost:5434"
echo "   • Extranet:     http://localhost:3000"
echo "   • Public App:   http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $EXTRANET_PID $APP_PID 2>/dev/null
    docker-compose down
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait

