#!/bin/bash

# Hybrid Encryption - Local Development Startup Script
# Usage: bash scripts/start-dev.sh

set -e

echo "🚀 Hybrid Encryption - Local Development Setup"
echo "═══════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✅ Docker is installed\n"

# Start MongoDB
echo "📦 Starting MongoDB container..."
docker-compose up -d mongodb

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 5

# Check if MongoDB is running
if docker exec hybrid-encryption-mongodb mongosh --version &> /dev/null; then
    echo "✅ MongoDB is running on localhost:27017\n"
else
    echo "⚠️  MongoDB container is starting, please wait..."
    sleep 5
fi

# Initialize database (if .env exists)
if [ -f "backend/.env" ] || [ -f "backend/.env.local" ]; then
    echo "🌱 Initializing database with sample data..."
    cd backend
    if ! node ../scripts/init-db.js; then
        echo "⚠️  Database initialization warning (continuing anyway)"
    fi
    cd ..
    echo ""
else
    echo "⚠️  No .env file found in backend/"
    echo "   Please copy .env.local to .env or create .env with:"
    echo "   MONGODB_URI=mongodb://localhost:27017/hybrid-encryption"
    echo ""
fi

echo "═══════════════════════════════════════════════"
echo "✨ Setup complete! You can now:"
echo ""
echo "1️⃣  In Terminal 1 - Start Backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2️⃣  In Terminal 2 - Start Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3️⃣  Open in Browser:"
echo "   http://localhost:5173"
echo ""
echo "4️⃣  MongoDB Admin:"
echo "   mongodb://localhost:27017"
echo ""
echo "📌 To stop MongoDB later:"
echo "   docker-compose down"
echo ""
echo "📌 To view MongoDB logs:"
echo "   docker-compose logs -f mongodb"
echo ""
