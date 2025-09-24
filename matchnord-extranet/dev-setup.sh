#!/bin/bash

# Development setup script for Tournament App

echo "🚀 Setting up Tournament App for development..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ .env.local created from env.example"
    echo "⚠️  Please edit .env.local and set your NEXTAUTH_SECRET"
else
    echo "✅ .env.local already exists"
fi

# Start database
echo "🐳 Starting PostgreSQL database..."
npm run db:up

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if migration is needed
echo "🔄 Running database migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/tournament_app" npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/tournament_app" npx prisma generate

# Seed database
echo "🌱 Seeding database with sample data..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/tournament_app" npm run prisma:seed

echo ""
echo "✅ Development setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env.local and set your NEXTAUTH_SECRET"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "📊 Database info:"
echo "   Host: localhost:5434"
echo "   Database: tournament_app"
echo "   User: postgres"
echo "   Password: postgres"
