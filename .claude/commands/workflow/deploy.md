# Deploy to Production Server

You are helping the user deploy changes to the production server at root@5.78.155.116.

## 🚨 CRITICAL PRE-DEPLOYMENT CHECKS

### Step 1: Confirm Readiness
Ask the user EXPLICITLY:
- ✅ "Are all changes committed and pushed to GitHub main branch?"
- ✅ "Have you tested these changes locally and they work correctly?"
- ✅ "Are you ready to deploy to PRODUCTION?"

**If NO to any, STOP and guide them through the proper steps first.**

### Step 2: Verify Local State
Check local repository:
```bash
git status
```
- Should show "nothing to commit, working tree clean"
- Should be on `main` branch
- Should be up to date with `origin/main`

If not clean:
- Uncommitted changes? Run `/safe-commit`
- Behind remote? Run `git pull origin main`
- On feature branch? Run `/merge-to-main` first

### Step 3: Show What Will Be Deployed
Check what's on production vs. what will be deployed:
```bash
git log origin/main --oneline -5
```
Show the user the recent commits that will be deployed.

## Deployment Process

### Step 4: SSH to Production Server
Note: This requires SSH access. If connection fails, user needs to:
- Ensure they have SSH credentials for root@5.78.155.116
- Add SSH key or password authentication

Connect to production:
```bash
ssh root@5.78.155.116
```

### Step 5: Navigate to Project Directory
```bash
cd /root/marketing-machine
```

### Step 6: Check Production Status
Before pulling changes:
```bash
git status
git log --oneline -3
```
- Verify we're on the right branch
- Check if there are any uncommitted changes on production
- ⚠️ If uncommitted changes exist, ask user what to do:
  - Stash them?
  - These might be important production changes!

### Step 7: Pull Latest Changes
```bash
git pull origin main
```

### Step 8: Install Dependencies
Check if dependencies need updating:
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Step 9: Restart Services
Ask the user how their production services are managed:

**Option A: PM2 (Process Manager)**
```bash
pm2 restart all
# or specific processes:
pm2 restart marketing-machine-backend
pm2 restart marketing-machine-frontend
```

**Option B: systemd**
```bash
sudo systemctl restart marketing-machine
```

**Option C: Docker**
```bash
docker-compose down && docker-compose up -d
```

**Option D: Manual**
User will need to stop and restart their services manually.

### Step 10: Verify Deployment
After restart, check:
- Services are running: `pm2 status` or `systemctl status` or `docker ps`
- Check logs for errors: `pm2 logs` or `journalctl -u marketing-machine -f`
- Ask user to verify the application is accessible

### Step 11: Exit SSH
```bash
exit
```

## Post-Deployment Checklist

Ask the user to verify:
- [ ] Application is accessible at production URL
- [ ] No error messages in logs
- [ ] New features/fixes are working as expected
- [ ] No critical errors reported

## Rollback Procedure (If Needed)

If deployment fails:
1. SSH back to production
2. Identify the last working commit hash
3. Roll back: `git reset --hard [commit-hash]`
4. Restart services
5. Investigate the issue locally

## Safety Reminders
- 🚨 This deploys to PRODUCTION - real users will see these changes
- 📝 Document any production-specific configuration changes
- 🔍 Monitor logs after deployment for any issues
- 💾 Consider backing up production database before major changes
