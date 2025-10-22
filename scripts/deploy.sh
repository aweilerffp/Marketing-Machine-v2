#!/bin/bash

# ==============================================================================
# Safe Production Deployment Script
# ==============================================================================
# Deploys latest code to production with safety checks and rollback capability
#
# Usage:
#   ./scripts/deploy.sh
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Marketing Machine - Production Deployment${NC}"
echo "=============================================="
echo ""

# Configuration
APP_DIR="/root/marketing-machine"
BACKUP_DIR="/root/marketing-machine-backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="/root/deployment-logs/$(date +%Y%m).log"

# Create necessary directories
mkdir -p "$(dirname $BACKUP_DIR)"
mkdir -p "$(dirname $LOG_FILE)"

# Logging function
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
handle_error() {
  log "❌ ERROR: $1"
  echo -e "${RED}❌ Deployment failed: $1${NC}"
  echo ""
  echo -e "${YELLOW}🔄 Would you like to rollback to the previous version? (y/N)${NC}"
  read -r response
  if [[ "$response" =~ ^[Yy]$ ]]; then
    rollback
  fi
  exit 1
}

# Rollback function
rollback() {
  echo -e "${YELLOW}🔄 Rolling back...${NC}"
  if [ -f "$BACKUP_DIR/commit.txt" ]; then
    ROLLBACK_COMMIT=$(cat "$BACKUP_DIR/commit.txt")
    cd "$APP_DIR"
    git reset --hard "$ROLLBACK_COMMIT"
    pm2 restart marketing-machine
    log "🔄 Rolled back to commit $ROLLBACK_COMMIT"
    echo -e "${GREEN}✅ Rollback complete${NC}"
  else
    echo -e "${RED}❌ No rollback commit found${NC}"
  fi
}

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check if we're in the right directory
cd "$APP_DIR" || handle_error "Cannot access $APP_DIR"

# Check Git status
if ! git status > /dev/null 2>&1; then
  handle_error "Not a git repository"
fi

# Check if PM2 is running
if ! pm2 list | grep -q "marketing-machine"; then
  handle_error "Marketing Machine is not running in PM2"
fi

log "✅ Pre-deployment checks passed"
echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
echo ""

# Create backup
echo -e "${YELLOW}📦 Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$BACKUP_DIR/commit.txt"
cp -r "$APP_DIR/backend/src" "$BACKUP_DIR/" 2>/dev/null || true
log "📦 Backup created at $BACKUP_DIR (commit: $CURRENT_COMMIT)"
echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Pull latest changes
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git fetch origin
BEFORE_COMMIT=$(git rev-parse HEAD)
git reset --hard origin/main
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" == "$AFTER_COMMIT" ]; then
  log "ℹ️  No new commits to deploy"
  echo -e "${BLUE}ℹ️  No new commits found. Already up to date.${NC}"
  echo ""
  exit 0
fi

log "📥 Pulled changes from $BEFORE_COMMIT to $AFTER_COMMIT"
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# Show what changed
echo -e "${YELLOW}📝 Changes in this deployment:${NC}"
git log --oneline "$BEFORE_COMMIT..$AFTER_COMMIT" | head -10
echo ""

# Backend deployment
echo -e "${YELLOW}🔧 Installing backend dependencies...${NC}"
cd "$APP_DIR/backend"
npm ci --production || handle_error "Backend npm install failed"
log "✅ Backend dependencies installed"
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Database migrations
echo -e "${YELLOW}🗃️  Running database migrations...${NC}"
npx prisma migrate deploy || handle_error "Database migration failed"
npx prisma generate || handle_error "Prisma generate failed"
log "✅ Database migrations completed"
echo -e "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Frontend build
echo -e "${YELLOW}🎨 Building frontend...${NC}"
cd "$APP_DIR/frontend"
npm ci || handle_error "Frontend npm install failed"
VITE_API_URL=https://trymarketingmachine.com npm run build || handle_error "Frontend build failed"
log "✅ Frontend built"
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Restart services
echo -e "${YELLOW}♻️  Restarting services...${NC}"
pm2 restart marketing-machine || handle_error "PM2 restart failed"
log "✅ Services restarted"
echo ""

# Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 5

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")

if [ "$HEALTH_STATUS" != "200" ]; then
  handle_error "Health check failed (status: $HEALTH_STATUS)"
fi

log "✅ Health check passed (status: $HEALTH_STATUS)"
echo -e "${GREEN}✅ Health check passed${NC}"
echo ""

# Deployment summary
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║   ✅  DEPLOYMENT SUCCESSFUL!           ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}📊 Deployment Summary:${NC}"
echo "  Previous commit: $(git rev-parse --short $BEFORE_COMMIT)"
echo "  Current commit:  $(git rev-parse --short $AFTER_COMMIT)"
echo "  Backup location: $BACKUP_DIR"
echo "  Deployment time: $(date)"
echo ""

log "✅ Deployment successful - commit $(git rev-parse --short HEAD)"

echo -e "${GREEN}✅ All done!${NC}"
