#!/bin/bash

# Email System E2E Test Script
echo "🧪 Starting Email System E2E Tests..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if database is running
echo "📊 Checking database connection..."
if ! docker ps | grep -q postgres; then
    echo "🚀 Starting database..."
    npm run db:up
    sleep 5
fi

# Check if application is running
echo "🌐 Checking application status..."
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "🚀 Starting development server..."
    npm run dev &
    DEV_PID=$!
    sleep 10
    
    # Wait for server to be ready
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null; then
            echo "✅ Server is ready!"
            break
        fi
        echo "⏳ Waiting for server... ($i/30)"
        sleep 2
    done
fi

# Run database migrations
echo "🗄️ Running database migrations..."
npm run prisma:migrate

# Run email system tests
echo "📧 Running Email System E2E Tests..."
npx playwright test e2e/email/email-system.spec.ts --project=chromium --reporter=list

# Capture exit code
TEST_EXIT_CODE=$?

# Cleanup
if [ ! -z "$DEV_PID" ]; then
    echo "🧹 Stopping development server..."
    kill $DEV_PID
fi

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All email system tests passed!"
else
    echo "❌ Some email system tests failed!"
fi

exit $TEST_EXIT_CODE
