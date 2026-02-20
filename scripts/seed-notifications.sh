#!/bin/bash

# Script to seed dummy notifications
# This is a one-time script for local development

echo "🚀 Running dummy notifications seeder..."
echo ""

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the TypeScript script using tsx (or ts-node)
if command -v tsx &> /dev/null; then
    tsx scripts/seed-dummy-notifications.ts
elif command -v ts-node &> /dev/null; then
    ts-node scripts/seed-dummy-notifications.ts
else
    echo "❌ Error: Neither 'tsx' nor 'ts-node' found."
    echo "Please install one of them:"
    echo "  npm install -g tsx"
    echo "  or"
    echo "  npm install -g ts-node"
    exit 1
fi
