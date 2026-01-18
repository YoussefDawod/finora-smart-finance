#!/bin/bash
# deploy.sh (für Production Server)

set -e

echo "🚀 Starting Finora API deployment..."

# Verzeichnis
cd /var/www/finora-api || exit 1

# Git Pull
echo "📥 Pulling latest code..."
git pull origin main

# Dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Environment Check
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

# Build/Test (optional)
echo "🧪 Running health check..."
npm run test 2>/dev/null || true

# PM2 Restart
echo "🔄 Restarting PM2..."
pm2 restart ecosystem.config.js --update-env

# Logs
echo "📋 Checking logs..."
pm2 logs finora-api --lines 20

echo "✅ Finora API deployment complete!"
pm2 status
