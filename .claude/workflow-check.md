# Workflow Status Check

You are helping the user understand their current workflow status and suggesting next steps.

## Status Assessment

### Step 1: Check Current Location
Verify the user is working locally:
```bash
pwd
```
Expected: `/Users/adamweiler/Documents/BMAD/marketing-machine` or subdirectory

⚠️ If on production server, warn: "You're on the production server! Always develop locally."

### Step 2: Git Status
```bash
git status
```

Analyze the output and report:
- Current branch
- Uncommitted changes (if any)
- Untracked files (if any)
- Relationship to remote (ahead/behind/diverged)

### Step 3: Branch Information
```bash
git branch --show-current
git log --oneline -3
```

Show:
- What branch they're on
- Recent commits

### Step 4: Remote Status
```bash
git fetch origin
git status
```

Check:
- Is local branch ahead/behind remote?
- Are there unpushed commits?

## Intelligent Suggestions

Based on the status, suggest the appropriate next step:

### Scenario A: Clean Working Directory on Main
```
✅ Status: Clean, on main branch
📍 Suggested Actions:
   1. Start a new feature: `/start-feature`
   2. Deploy to production: `/deploy`
   3. Pull latest changes: `git pull origin main`
```

### Scenario B: Clean Working Directory on Feature Branch
```
✅ Status: Clean, on feature branch
📍 Suggested Actions:
   1. Make code changes
   2. Commit when ready: `/safe-commit`
   3. Merge to main when complete: `/merge-to-main`
```

### Scenario C: Uncommitted Changes
```
⚠️ Status: You have uncommitted changes
📍 Files changed: [list files]
📍 Suggested Actions:
   1. Review changes: `git diff`
   2. Commit changes: `/safe-commit`
   3. Discard changes: `git checkout .` (⚠️ destructive!)
   4. Stash changes: `git stash`
```

### Scenario D: Unpushed Commits
```
⚠️ Status: You have commits not pushed to GitHub
📍 Commits ahead: [number]
📍 Suggested Actions:
   1. Push to GitHub: `/push-feature`
   2. Review commits first: `git log origin/[branch]..HEAD`
```

### Scenario E: Behind Remote
```
⚠️ Status: Your branch is behind the remote
📍 Suggested Actions:
   1. Pull latest changes: `git pull origin [branch]`
   2. Review incoming changes first: `git log HEAD..origin/[branch]`
```

### Scenario F: On Main with Uncommitted Changes
```
🚨 WARNING: You're on main branch with uncommitted changes!
📍 Suggested Actions:
   1. Create feature branch: `/start-feature`
   2. Or commit to main (only if intentional): `/safe-commit`
```

## Deployment Status

### Check Production vs Local
```bash
git log origin/main --oneline -3
```

Compare with production (requires SSH):
```bash
ssh root@5.78.155.116 "cd /root/marketing-machine && git log --oneline -3"
```

Report:
- Is production behind GitHub main?
- Are there undeployed changes?
- Suggest: `/deploy` if needed

## Quick Reference

Show the user available workflow commands:
```
📚 Available Workflow Commands:
   /workflow-check  - Show current status (this command)
   /start-feature   - Begin new feature development
   /safe-commit     - Commit changes with safety checks
   /push-feature    - Push branch to GitHub
   /merge-to-main   - Merge feature to main branch
   /deploy          - Deploy to production server
```

## Development Server Status

Check if dev servers are running:
```bash
lsof -i :3000 -i :5000 | grep LISTEN
```

Report:
- Backend server status (typically port 5000)
- Frontend server status (typically port 3000)
- Suggest starting servers if not running
