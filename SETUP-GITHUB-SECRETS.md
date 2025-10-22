# GitHub Secrets Setup Guide

## Overview

To enable automated CI/CD deployments, you need to configure GitHub repository secrets. This guide walks you through the process step-by-step.

## Prerequisites

- Admin access to the GitHub repository (https://github.com/aweilerffp/Marketing-Machine-v2)
- SSH access to production server
- SSH key pair (we'll generate if needed)

## Step-by-Step Setup

### Step 1: Generate SSH Key (if you don't have one)

On your **local machine** (NOT the production server):

```bash
# Generate a new SSH key specifically for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# This creates two files:
# - ~/.ssh/github_actions_deploy (private key) - for GitHub Secrets
# - ~/.ssh/github_actions_deploy.pub (public key) - for server
```

### Step 2: Add Public Key to Production Server

```bash
# Copy the public key
cat ~/.ssh/github_actions_deploy.pub

# SSH to production server
ssh root@your-server-ip

# Add the public key to authorized_keys
echo "PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys

# Verify permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Exit server
exit
```

### Step 3: Test SSH Connection

```bash
# Test the new key works
ssh -i ~/.ssh/github_actions_deploy root@your-server-ip

# If it works, you should connect without password
# Exit and continue
exit
```

### Step 4: Configure GitHub Secrets

1. **Navigate to Repository Settings**
   - Go to: https://github.com/aweilerffp/Marketing-Machine-v2
   - Click **Settings** tab (top right)
   - Click **Secrets and variables** → **Actions** (left sidebar)

2. **Add SSH_PRIVATE_KEY**
   - Click **New repository secret**
   - Name: `SSH_PRIVATE_KEY`
   - Value: Copy the **entire** private key:
     ```bash
     cat ~/.ssh/github_actions_deploy
     ```
   - This includes the lines:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     ...
     -----END OPENSSH PRIVATE KEY-----
     ```
   - Click **Add secret**

3. **Add PRODUCTION_HOST**
   - Click **New repository secret**
   - Name: `PRODUCTION_HOST`
   - Value: Your server IP or hostname (e.g., `123.456.789.0`)
   - Click **Add secret**

4. **Add PRODUCTION_USER**
   - Click **New repository secret**
   - Name: `PRODUCTION_USER`
   - Value: `root` (or your server username)
   - Click **Add secret**

5. **Add SSH_PORT** (Optional - only if not using port 22)
   - Click **New repository secret**
   - Name: `SSH_PORT`
   - Value: `22` (or your custom SSH port)
   - Click **Add secret**

### Step 5: Verify Secrets

You should now see these secrets listed (values hidden):
- ✅ SSH_PRIVATE_KEY
- ✅ PRODUCTION_HOST
- ✅ PRODUCTION_USER
- ✅ SSH_PORT (optional)

## Testing the Deployment

### Option 1: Push Current Changes

```bash
# On the production server (where we just committed)
cd /root/marketing-machine

# Push to GitHub
git push origin main

# This will trigger the GitHub Actions workflow
```

### Option 2: Make a Test Change

```bash
# On your local machine
git clone https://github.com/aweilerffp/Marketing-Machine-v2.git
cd Marketing-Machine-v2

# Make a small change
echo "# Test deployment" >> TEST.md
git add TEST.md
git commit -m "Test automated deployment"
git push origin main
```

## Monitoring the Deployment

1. **Watch GitHub Actions**
   - Go to repository on GitHub
   - Click **Actions** tab
   - You should see a new workflow running
   - Click on it to see real-time logs

2. **Watch Server Logs**
   ```bash
   # SSH to server
   ssh root@your-server

   # Watch PM2 logs
   pm2 logs marketing-machine --lines 50

   # Check deployment log
   tail -f /root/deployment-logs/$(date +%Y%m).log
   ```

## Troubleshooting

### Authentication Failed

**Symptom**: GitHub Actions shows "Permission denied (publickey)"

**Solution**:
1. Verify the public key is in server's `~/.ssh/authorized_keys`
2. Check SSH key format in GitHub Secrets (must include BEGIN/END lines)
3. Verify server allows key-based authentication

### Host Key Verification Failed

**Symptom**: "Host key verification failed"

**Solution**:
Add server to known hosts in the GitHub Action (already included in workflow)

### Deployment Fails

**Symptom**: Workflow completes but deployment script fails

**Solution**:
1. SSH to server manually
2. Check deployment logs:
   ```bash
   cat /root/deployment-logs/$(date +%Y%m).log
   ```
3. Check PM2 status:
   ```bash
   pm2 list
   pm2 logs marketing-machine --lines 100
   ```

### Health Check Fails

**Symptom**: Health check returns non-200 status

**Solution**:
1. Check if backend is running:
   ```bash
   pm2 list
   ```
2. Test health endpoint manually:
   ```bash
   curl http://localhost:3001/api/health
   ```
3. Check application logs:
   ```bash
   pm2 logs marketing-machine
   ```

## Current Server Information

Based on the current setup:
- **Server**: ubuntu-2gb-hil-2
- **User**: root
- **App Directory**: /root/marketing-machine
- **SSH Port**: 22 (default)

You'll need to update PRODUCTION_HOST with your actual server IP/hostname.

## Security Best Practices

1. ✅ **Use dedicated SSH key** for CI/CD (separate from your personal key)
2. ✅ **Limit key access** to only root@production-server
3. ✅ **Rotate keys periodically** (every 90 days recommended)
4. ⚠️ **Never share private keys** or commit them to git
5. ⚠️ **Monitor deployment logs** for suspicious activity

## Next Steps

After setting up secrets:

1. **Test the deployment** by pushing a small change
2. **Verify** the workflow runs successfully
3. **Monitor** application logs after deployment
4. **Set up** local development environment (see docs/LOCAL-DEVELOPMENT.md)

## Getting Help

If you run into issues:
1. Check GitHub Actions logs
2. Check server deployment logs
3. Verify all secrets are set correctly
4. Test SSH connection manually
5. Check server firewall/security settings

## Summary Checklist

- [ ] SSH key pair generated
- [ ] Public key added to server
- [ ] SSH connection tested
- [ ] GitHub Secrets configured:
  - [ ] SSH_PRIVATE_KEY
  - [ ] PRODUCTION_HOST
  - [ ] PRODUCTION_USER
  - [ ] SSH_PORT (if needed)
- [ ] Test deployment run successfully
- [ ] Application running after deployment

Once all checkboxes are complete, your CI/CD pipeline is ready! 🚀
