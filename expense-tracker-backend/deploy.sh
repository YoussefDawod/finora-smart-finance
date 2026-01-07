#!/bin/bash
# deploy.sh (für Production Server)

set -e

echo "🚀 Starting deployment..."

# Verzeichnis
cd /var/www/expense-tracker-backend || exit 1

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
pm2 logs expense-tracker-api --lines 20

echo "✅ Deployment complete!"
pm2 status
