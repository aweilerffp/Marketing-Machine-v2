#!/bin/bash

# Marketing Machine - Marketing Site Deployment Script
# Deploy to VPS at 5.78.155.116

set -e

echo "🚀 Deploying Marketing Site to VPS..."

# Configuration
SERVER="root@5.78.155.116"
REMOTE_DIR="/root/marketing-machine/marketing-site"
LOCAL_DIR="."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Build locally
echo -e "${BLUE}📦 Building site locally...${NC}"
npm run build

# Step 2: Sync files to server (excluding node_modules and .next for now)
echo -e "${BLUE}📤 Syncing files to server...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'package-lock.json' \
  --exclude 'pnpm-lock.yaml' \
  $LOCAL_DIR/ $SERVER:$REMOTE_DIR/

# Step 3: SSH into server and complete deployment
echo -e "${BLUE}🔧 Installing dependencies and building on server...${NC}"
ssh $SERVER << 'ENDSSH'
cd /root/marketing-machine/marketing-site

# Install dependencies
echo "Installing dependencies..."
npm install --production=false

# Build on server
echo "Building Next.js app..."
NODE_ENV=production npm run build

# Restart PM2 process
echo "Restarting PM2 process..."
pm2 restart marketing-site || pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"
ENDSSH

echo -e "${GREEN}✨ Marketing site deployed successfully!${NC}"
echo -e "${GREEN}🌐 Site should be live at: https://trymarketingmachine.com${NC}"
