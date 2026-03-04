#!/bin/bash
# deploy.sh — Production deployment for Finora Smart Finance API
# Tests and lint MUST pass before deployment proceeds.

set -euo pipefail

# ============================================
# CONFIG
# ============================================
APP_DIR="/var/www/finora-smart-finance-api"
APP_NAME="finora-smart-finance-api"
BRANCH="main"

# ============================================
# HELPERS
# ============================================
log()   { echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO]  $*"; }
warn()  { echo "$(date '+%Y-%m-%d %H:%M:%S') [WARN]  $*" >&2; }
fail()  { echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $*" >&2; exit 1; }

# ============================================
# PRE-FLIGHT CHECKS
# ============================================
log "🚀 Starting Finora API deployment..."

cd "$APP_DIR" || fail "Could not change to $APP_DIR"

if [ ! -f ".env.production" ]; then
  fail "❌ .env.production not found! Aborting deployment."
fi

# ============================================
# GIT PULL
# ============================================
log "📥 Pulling latest code from $BRANCH..."
git pull origin "$BRANCH" || fail "Git pull failed"

# ============================================
# DEPENDENCIES
# ============================================
# Install ALL dependencies (including devDependencies for testing)
log "📦 Installing dependencies..."
npm ci || fail "npm ci failed"

# ============================================
# LINT
# ============================================
log "🔍 Running lint..."
npm run lint || fail "❌ Lint failed — fix lint errors before deploying."

# ============================================
# TESTS (blocking — deployment aborts on failure)
# ============================================
log "🧪 Running tests..."
npm test || fail "❌ Tests failed — deployment aborted. Fix failing tests before deploying."

# ============================================
# PRUNE DEV DEPENDENCIES
# ============================================
log "🧹 Pruning devDependencies for production..."
npm prune --production || warn "npm prune failed (non-critical)"

# ============================================
# PM2 RESTART (with graceful reload)
# ============================================
log "🔄 Restarting PM2 (graceful reload)..."

# Save current PM2 process list for rollback reference
pm2 save --force 2>/dev/null || true

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  # App exists — graceful reload (zero-downtime in cluster mode)
  pm2 reload ecosystem.config.js --update-env || fail "PM2 reload failed"
else
  # First deploy — start fresh
  pm2 start ecosystem.config.js --update-env || fail "PM2 start failed"
fi

# ============================================
# HEALTH CHECK
# ============================================
log "🏥 Running health check..."
sleep 3

# Check if the process is online
if ! pm2 describe "$APP_NAME" | grep -q "online"; then
  fail "❌ Health check failed — app is not online after restart."
fi

# Optional: HTTP health check (if health endpoint exists)
HEALTH_URL="http://localhost:${PORT:-5000}/api/health"
if command -v curl &> /dev/null; then
  HTTP_STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    log "✅ Health endpoint responded with 200 OK"
  else
    warn "⚠️  Health endpoint returned $HTTP_STATUS (endpoint may not exist yet)"
  fi
fi

# ============================================
# DONE
# ============================================
log "📋 Recent logs:"
pm2 logs "$APP_NAME" --lines 10 --nostream 2>/dev/null || true

log "✅ Finora API deployment complete!"
pm2 status
