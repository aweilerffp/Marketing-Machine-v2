# Marketing Machine Workflow Commands

These slash commands help guide you through the development workflow with built-in safety checks and guardrails.

## Quick Start

When working on a new feature:
1. `/workflow-check` - See current status
2. `/start-feature` - Create feature branch
3. Make your code changes
4. `/safe-commit` - Commit with safety checks
5. `/push-feature` - Push to GitHub
6. `/merge-to-main` - Merge to main branch
7. `/deploy` - Deploy to production

## Available Commands

### `/workflow-check`
**What it does:** Shows your current git status and suggests next steps

**When to use:**
- Starting your work session
- Confused about what to do next
- Want to see if there are unpushed changes
- Check if production is behind local

**Example output:**
```
✅ Status: Clean, on feature/linkedin-improvements
📍 Suggested Actions:
   1. Commit changes: /safe-commit
   2. Push to GitHub: /push-feature
```

---

### `/start-feature`
**What it does:** Guides you through creating a new feature branch

**When to use:**
- Starting work on a new feature
- Beginning a bug fix
- Starting any new development work

**Safety checks:**
- Checks for uncommitted changes
- Updates main branch first
- Prompts for proper branch naming (feature/, fix/, enhancement/, refactor/)

**Example:**
```
User runs: /start-feature
Claude: "What type of change is this?"
User: "feature"
Claude: "What's a brief name for this feature?"
User: "improve-dashboard-metrics"
Claude creates: feature/improve-dashboard-metrics
```

---

### `/safe-commit`
**What it does:** Commits your changes with safety checks and best practices

**When to use:**
- You've made changes and want to commit them
- Before pushing to GitHub
- Before switching branches

**Safety checks:**
- ⚠️ Warns if committing directly to main
- 🔍 Checks for sensitive files (.env, credentials)
- 📝 Helps craft proper commit messages
- ✅ Asks if you've tested changes

**Commit message format:**
- `feat:` New feature
- `fix:` Bug fix
- `enhancement:` Improvement
- `refactor:` Code refactoring
- `docs:` Documentation
- `chore:` Maintenance

---

### `/push-feature`
**What it does:** Safely pushes your feature branch to GitHub

**When to use:**
- After committing changes
- Want to back up your work to GitHub
- Ready to create a pull request
- Want to share work with team

**Safety checks:**
- Checks for uncommitted changes
- Shows commits that will be pushed
- Fetches latest remote changes first

**Next steps suggested:**
- Create pull request
- Merge to main
- Continue development

---

### `/merge-to-main`
**What it does:** Merges your feature branch into main

**When to use:**
- Feature is complete and tested
- Bug fix is ready
- Ready to prepare for deployment

**Safety checks:**
- ⚠️ Asks if changes are tested
- ⚠️ Confirms code is production-ready
- Updates main branch first
- Shows commits that will be merged
- Handles merge conflicts

**Reminder:** Merging to main does NOT deploy to production!

---

### `/deploy`
**What it does:** Deploys changes to production server (root@5.78.155.116)

**When to use:**
- Changes are merged to main
- Changes are tested and ready for production
- Need to update production server

**Safety checks:**
- 🚨 Confirms all changes are committed and pushed
- 🚨 Asks if changes are tested
- 🚨 Confirms deployment to PRODUCTION
- Checks production server status first
- Verifies services restart successfully

**Steps performed:**
1. SSH to production server
2. Pull latest changes from main
3. Install dependencies
4. Restart services (PM2/systemd/Docker)
5. Verify deployment

---

## Development Workflow Examples

### Example 1: Quick Bug Fix
```
1. /workflow-check          # Check status
2. /start-feature           # Create fix/bug-name
3. [Make code changes]
4. Test locally
5. /safe-commit            # Commit fix
6. /merge-to-main          # Merge to main
7. /deploy                 # Deploy to production
```

### Example 2: New Feature Development
```
1. /start-feature          # Create feature/feature-name
2. [Make changes over several days]
3. /safe-commit           # Commit changes
4. /push-feature          # Backup to GitHub
5. [More changes]
6. /safe-commit           # Another commit
7. /push-feature          # Push again
8. /merge-to-main         # When feature complete
9. /deploy                # Deploy to production
```

### Example 3: Forgot Where I Am
```
1. /workflow-check        # Shows status and suggests next steps
```

## Important Rules

### ✅ DO:
- Always develop locally
- Create feature branches for changes
- Test before committing
- Test before deploying
- Use descriptive commit messages
- Run `/workflow-check` when unsure

### ❌ DON'T:
- Develop directly on production server
- Commit directly to main (create feature branch instead)
- Deploy untested changes
- Commit sensitive files (.env, credentials)
- Force push to main
- Skip testing

## Production Server Info

- **Server:** root@5.78.155.116
- **Project Location:** /root/marketing-machine
- **Purpose:** Production deployment ONLY (no development)

## Getting Help

If you're unsure what to do next:
1. Run `/workflow-check` to see current status
2. Ask Claude "What should I do next?"
3. Reference this README

## Troubleshooting

### "I'm on main with uncommitted changes"
→ Run `/start-feature` to create a branch, or commit to main if intentional

### "I forgot to create a feature branch"
→ Create one now: `git checkout -b feature/name` (moves changes to new branch)

### "I have merge conflicts"
→ `/merge-to-main` will guide you through resolution

### "Production deployment failed"
→ Check logs, rollback if needed, fix locally, redeploy

### "I committed sensitive files"
→ Remove from git, add to .gitignore, commit again
