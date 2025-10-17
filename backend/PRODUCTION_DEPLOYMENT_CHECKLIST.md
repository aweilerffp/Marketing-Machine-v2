# Production Deployment Security Checklist

**CRITICAL: Complete this checklist before deploying to Hetzner VPS or any production environment!**

Last updated: 2025-10-14

---

## 🔴 **P0 BLOCKERS - Must Complete Before Deployment**

### ✅ 1. API Keys Rotated
- [x] Anthropic API key rotated (2025-10-14)
- [x] Old exposed keys added to blocklist
- [ ] **TODO: Generate production Anthropic key** (separate from development)
- [ ] **TODO: Set usage limits** on production API keys ($100/month recommended)
- [ ] **TODO: Enable billing alerts** (50%, 75%, 90% thresholds)

### ✅ 2. Dependencies Secured
- [x] Axios updated to 1.12.2+ (DoS vulnerability fixed)
- [x] npm audit shows only low-severity issues
- [ ] **TODO: Plan Clerk SDK upgrade to v5** (address low-severity cookie issues)

### ✅ 3. Encryption Key Generated
- [x] Secure ENCRYPTION_KEY generated for development
- [ ] **TODO: Generate SEPARATE production ENCRYPTION_KEY**
- [ ] **TODO: Store production key securely** (PM2 config, not .env file)

### 🚨 4. Authentication Security - CRITICAL!
- [x] Auth bypass working in development
- [ ] **TODO: Set `ALLOW_AUTH_BYPASS=false` in production**
- [ ] **TODO: Set `NODE_ENV=production`**
- [ ] **TODO: Configure production Clerk keys**
  - [ ] Replace `CLERK_SECRET_KEY` with production key (starts with `sk_live_`)
  - [ ] Replace `CLERK_PUBLISHABLE_KEY` with production key
- [ ] **TODO: Test authentication flow in staging**

---

## 🔧 **Production Environment Variables**

### Required for Production (MUST SET):

```bash
# ===========================================
# PRODUCTION ENVIRONMENT VARIABLES
# ===========================================

# 🚨 CRITICAL: Server Configuration
NODE_ENV=production                    # MUST be "production"
PORT=3001
FRONTEND_URL=https://your-domain.com   # Your actual domain

# 🚨 CRITICAL: Authentication & Security
ALLOW_AUTH_BYPASS=false                # MUST be false!
# DO NOT SET DEV_USER_ID in production

# Database (PostgreSQL recommended for production)
DATABASE_URL="postgresql://user:password@localhost:5432/marketing_machine?sslmode=require"

# Encryption Key (for OAuth tokens)
ENCRYPTION_KEY="<GENERATE_NEW_32_BYTE_KEY_FOR_PRODUCTION>"
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Authentication (Clerk - Production Keys)
CLERK_PUBLISHABLE_KEY="pk_live_YOUR_PRODUCTION_KEY"
CLERK_SECRET_KEY="sk_live_YOUR_PRODUCTION_KEY"

# Anthropic Claude (Production API Key)
ANTHROPIC_API_KEY="sk-ant-api03-YOUR_PRODUCTION_KEY"
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=20000
CLAUDE_TEMPERATURE=0.7

# OpenAI (Optional - for fallback)
OPENAI_API_KEY="sk-YOUR_PRODUCTION_KEY"
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7

# LinkedIn OAuth
LINKEDIN_CLIENT_ID="your_production_client_id"
LINKEDIN_CLIENT_SECRET="your_production_client_secret"
LINKEDIN_REDIRECT_URI="https://your-domain.com/api/auth/linkedin/callback"

# Read.ai Webhook
READAI_WEBHOOK_SECRET="your_production_webhook_secret"

# Redis (Production instance)
REDIS_ENABLED=true
REDIS_URL="redis://your-redis-host:6379"
REDIS_HOST="your-redis-host"
REDIS_PORT=6379
# If using Redis with password:
# REDIS_URL="redis://:password@your-redis-host:6379"

# Content Generation Settings
DEFAULT_HOOKS_PER_MEETING=3
MAX_LINKEDIN_POST_LENGTH=150
```

---

## 🔐 **Secret Management for Hetzner VPS**

### ⚠️ NEVER copy .env files to production!

### **Recommended Approach: PM2 Ecosystem File**

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'marketing-machine',
    script: './src/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      FRONTEND_URL: 'https://your-domain.com',

      // CRITICAL: Auth must be enabled
      ALLOW_AUTH_BYPASS: 'false',

      // Database
      DATABASE_URL: 'postgresql://user:password@localhost:5432/marketing_machine?sslmode=require',

      // Encryption
      ENCRYPTION_KEY: '<YOUR_PRODUCTION_KEY>',

      // Authentication
      CLERK_PUBLISHABLE_KEY: 'pk_live_...',
      CLERK_SECRET_KEY: 'sk_live_...',

      // APIs
      ANTHROPIC_API_KEY: 'sk-ant-api03-...',
      OPENAI_API_KEY: 'sk-...',

      // LinkedIn
      LINKEDIN_CLIENT_ID: '...',
      LINKEDIN_CLIENT_SECRET: '...',
      LINKEDIN_REDIRECT_URI: 'https://your-domain.com/api/auth/linkedin/callback',

      // Read.ai
      READAI_WEBHOOK_SECRET: '...',

      // Redis
      REDIS_ENABLED: 'true',
      REDIS_URL: 'redis://localhost:6379',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',

      // Content Settings
      DEFAULT_HOOKS_PER_MEETING: '3',
      MAX_LINKEDIN_POST_LENGTH: '150'
    }
  }]
};
```

**Deploy with:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Configure PM2 to start on boot
```

### **Alternative: Systemd Service**

Create `/etc/systemd/system/marketing-machine.service`:

```ini
[Unit]
Description=Marketing Machine Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=marketing-machine
WorkingDirectory=/opt/marketing-machine/backend
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="ALLOW_AUTH_BYPASS=false"
Environment="DATABASE_URL=postgresql://user:password@localhost:5432/marketing_machine"
Environment="ENCRYPTION_KEY=<YOUR_KEY>"
Environment="CLERK_SECRET_KEY=sk_live_..."
Environment="ANTHROPIC_API_KEY=sk-ant-api03-..."
# ... add all other environment variables

ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## ✅ **Pre-Deployment Validation Script**

Create this script to verify configuration before deploying:

**`scripts/validate-production-config.sh`:**

```bash
#!/bin/bash

echo "🔍 Validating Production Configuration..."
echo ""

ERRORS=0

# Check critical environment variables
if [ "$ALLOW_AUTH_BYPASS" = "true" ]; then
  echo "❌ CRITICAL: ALLOW_AUTH_BYPASS is enabled!"
  echo "   This will bypass ALL authentication in production!"
  ERRORS=$((ERRORS + 1))
fi

if [ "$NODE_ENV" != "production" ]; then
  echo "❌ ERROR: NODE_ENV is not 'production' (currently: $NODE_ENV)"
  ERRORS=$((ERRORS + 1))
fi

if [ -z "$ENCRYPTION_KEY" ]; then
  echo "❌ ERROR: ENCRYPTION_KEY not set"
  ERRORS=$((ERRORS + 1))
fi

if [[ "$CLERK_SECRET_KEY" == "sk_test_"* ]]; then
  echo "⚠️  WARNING: Using test Clerk key in production"
  ERRORS=$((ERRORS + 1))
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "❌ ERROR: ANTHROPIC_API_KEY not set"
  ERRORS=$((ERRORS + 1))
fi

if [[ "$DATABASE_URL" == *"sqlite"* ]]; then
  echo "⚠️  WARNING: Using SQLite in production (PostgreSQL recommended)"
fi

# Check if .env files exist (they shouldn't in production)
if [ -f ".env" ] || [ -f ".env.local" ]; then
  echo "⚠️  WARNING: .env files found in production directory"
  echo "   Secrets should be in PM2 config or systemd, not .env files"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Production configuration validated - safe to deploy"
  exit 0
else
  echo "❌ Found $ERRORS critical configuration issue(s)"
  echo "🛑 DO NOT DEPLOY until these are fixed!"
  exit 1
fi
```

**Make it executable:**
```bash
chmod +x scripts/validate-production-config.sh
```

**Run before deploying:**
```bash
# Load production env vars, then validate
pm2 start ecosystem.config.js --env production --no-daemon &
PID=$!
sleep 2
./scripts/validate-production-config.sh
kill $PID
```

---

## 🚀 **Deployment Steps for Hetzner VPS**

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Application Deployment
```bash
# Create application user
sudo useradd -m -s /bin/bash marketing-machine
sudo usermod -aG sudo marketing-machine

# Clone/copy application
sudo mkdir -p /opt/marketing-machine
sudo chown marketing-machine:marketing-machine /opt/marketing-machine
# ... copy your application files

# Install dependencies
cd /opt/marketing-machine/backend
npm ci --production

# Run Prisma migrations
npx prisma migrate deploy

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions to enable startup
```

### 3. Configure nginx Reverse Proxy

Create `/etc/nginx/sites-available/marketing-machine`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/marketing-machine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configure SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl restart nginx
```

---

## 📊 **Post-Deployment Verification**

Run these checks after deploying:

```bash
# 1. Check application is running
pm2 status

# 2. Check logs for errors
pm2 logs marketing-machine --lines 50

# 3. Test health endpoint
curl https://your-domain.com/health

# 4. Verify authentication is NOT bypassed
curl https://your-domain.com/api/company
# Should return: 401 Unauthorized (good!)

# 5. Check API key validation
pm2 logs | grep "API key validation"
# Should show: ✅ API key validation passed

# 6. Monitor resource usage
pm2 monit

# 7. Check database connectivity
sudo -u postgres psql -c "\l" | grep marketing_machine

# 8. Check Redis connectivity
redis-cli ping
# Should return: PONG
```

---

## 🔄 **Key Rotation Schedule**

Set up regular security maintenance:

| Item | Frequency | Action |
|------|-----------|--------|
| Anthropic API Key | Every 90 days | Rotate via console |
| ENCRYPTION_KEY | Every 180 days | Generate new, re-encrypt tokens |
| Clerk Keys | Annually | Review and rotate if needed |
| LinkedIn OAuth | Annually | Review credentials |
| PostgreSQL Password | Every 90 days | Update via ALTER USER |
| SSL Certificate | Automatic | Certbot auto-renewal (verify monthly) |

**Set calendar reminders!**

---

## 🆘 **Rollback Plan**

If deployment fails:

```bash
# 1. Stop the application
pm2 stop marketing-machine

# 2. Check logs
pm2 logs marketing-machine --err --lines 100

# 3. If database issue, rollback migration
cd /opt/marketing-machine/backend
npx prisma migrate reset --force

# 4. Restore from backup
# (Follow your backup restoration procedure)

# 5. Restart with previous version
pm2 delete marketing-machine
# ... redeploy previous version
pm2 start ecosystem.config.js --env production
```

---

## 📞 **Emergency Contacts**

- **Hetzner Support**: https://docs.hetzner.com/
- **Anthropic Status**: https://status.anthropic.com/
- **Clerk Status**: https://status.clerk.com/

---

## ✅ **Final Checklist**

Before considering deployment complete:

- [ ] All P0 security issues resolved
- [ ] `ALLOW_AUTH_BYPASS=false` verified
- [ ] `NODE_ENV=production` set
- [ ] Production API keys configured
- [ ] Separate ENCRYPTION_KEY for production
- [ ] Database migrations applied
- [ ] Redis running and accessible
- [ ] nginx configured and SSL enabled
- [ ] Firewall rules active
- [ ] PM2 process running stable
- [ ] Health checks passing
- [ ] Authentication tested (returns 401 without valid session)
- [ ] Monitoring/alerting configured
- [ ] Backup system in place
- [ ] Team trained on deployment process
- [ ] Rollback plan documented and tested

---

**Document Status:** ✅ Complete
**Last Security Audit:** 2025-10-14
**Next Review:** Before production deployment
