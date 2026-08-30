#!/usr/bin/env bash
# ============================================================================
# Financial Time Machine (FTM) v2.0.0 - Production Deployment Script
# Shell script to build and deploy Docker multi-container platform
# ============================================================================

set -euo pipefail

echo "⚡ Starting Financial Time Machine Deployment..."

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

# Build and start services
echo "🐳 Building Docker containers..."
docker-compose up -d --build

echo "✅ Financial Time Machine successfully deployed!"
echo "🌐 Frontend: http://localhost:5173"
echo "📡 Backend API: http://localhost:8001/docs"
