# Deployment Guide

## Overview

This project uses automated CI/CD via GitHub Actions to deploy to production. Every push to the `main` branch automatically triggers a deployment.

## Prerequisites

1. **GitHub Account** with push access to the repository
2. **SSH Access** to production server
3. **GitHub Secrets** configured (see below)

## Setup GitHub Secrets

To enable automated deployments, configure these secrets in your GitHub repository:

### Step 1: Navigate to Repository Settings

1. Go to https://github.com/aweilerffp/Marketing-Machine-v2
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add Required Secrets

Add the following secrets:

#### `SSH_PRIVATE_KEY`
Your SSH private key for accessing the production server.

**How to get it:**
```bash
# On your local machine (NOT the server)
cat ~/.ssh/id_rsa  # or id_ed25519
```

Copy the entire key including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ IMPORTANT**: Never share this key or commit it to git!

#### `PRODUCTION_HOST`
The IP address or hostname of your production server.

Example:
```
123.456.789.0
```

or
```
trymarketingmachine.com
```

#### `PRODUCTION_USER`
The SSH user for server access.

Example:
```
root
```

#### `SSH_PORT` (Optional)
SSH port if different from 22.

Example:
```
22
```

### Step 3: Verify Secrets

After adding all secrets, you should see:
- ✅ SSH_PRIVATE_KEY
- ✅ PRODUCTION_HOST
- ✅ PRODUCTION_USER
- ✅ SSH_PORT (optional)

## Deployment Process

### Automatic Deployment

1. Make changes to your code locally
2. Commit changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   ```
3. Push to main branch:
   ```bash
   git push origin main
   ```
4. GitHub Actions automatically:
   - Pulls latest code on server
   - Installs dependencies
   - Runs database migrations
   - Builds frontend
   - Restarts PM2
   - Runs health checks
   - Rolls back on failure

### Manual Deployment

If you need to deploy manually on the server:

```bash
# SSH to server
ssh root@your-server

# Navigate to project
cd /root/marketing-machine

# Run deployment script
./scripts/deploy.sh
```

## Deployment Workflow

```
Local Development
       ↓
   git commit
       ↓
  git push origin main
       ↓
GitHub Actions Triggered
       ↓
┌─────────────────────┐
│ Checkout Code       │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ SSH to Server       │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Create Backup       │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Pull Latest Code    │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Install Dependencies│
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Run DB Migrations   │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Build Frontend      │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Restart PM2         │
└─────────────────────┘
       ↓
┌─────────────────────┐
│ Health Check        │
└─────────────────────┘
       ↓
  ✅ Success!
```

## Monitoring Deployments

### View GitHub Actions

1. Go to repository on GitHub
2. Click **Actions** tab
3. See all deployment runs

### View Deployment Logs on Server

```bash
# View current month's deployments
cat /root/deployment-logs/$(date +%Y%m).log

# View all deployments
ls -lh /root/deployment-logs/
```

### View Backups

```bash
# List all backups
ls -lh /root/marketing-machine-backups/

# Most recent backup
ls -lt /root/marketing-machine-backups/ | head -2
```

## Rollback

If something goes wrong, you can rollback:

### Automatic Rollback

The deployment script automatically rolls back on failure.

### Manual Rollback

```bash
# SSH to server
ssh root@your-server

# Find the backup you want to restore
ls -lt /root/marketing-machine-backups/

# Navigate to project
cd /root/marketing-machine

# Reset to specific commit
BACKUP_DIR="/root/marketing-machine-backups/20250122_153045"
COMMIT=$(cat $BACKUP_DIR/commit.txt)
git reset --hard $COMMIT

# Restart services
pm2 restart marketing-machine
```

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs
2. SSH to server and check:
   ```bash
   pm2 logs marketing-machine --lines 100
   ```
3. Check deployment logs:
   ```bash
   tail -50 /root/deployment-logs/$(date +%Y%m).log
   ```

### Health Check Failed

1. Check if server is running:
   ```bash
   pm2 list
   ```
2. Check application logs:
   ```bash
   pm2 logs marketing-machine
   ```
3. Test health endpoint manually:
   ```bash
   curl http://localhost:3001/api/health
   ```

### Database Migration Failed

1. SSH to server
2. Check migration status:
   ```bash
   cd /root/marketing-machine/backend
   npx prisma migrate status
   ```
3. Manually run migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Best Practices

1. ✅ **Test locally first** before pushing to production
2. ✅ **Write descriptive commit messages**
3. ✅ **Check GitHub Actions status** after pushing
4. ✅ **Monitor application logs** after deployment
5. ✅ **Keep backups** for at least 30 days
6. ⚠️ **Never commit sensitive data** (API keys, passwords)
7. ⚠️ **Don't push directly to main** from server

## Security

- SSH keys are encrypted in GitHub Secrets
- Never commit `.env` files
- Use different API keys for dev/production
- Regularly rotate SSH keys
- Monitor deployment logs for suspicious activity
