# Push Feature to GitHub

You are helping the user push their feature branch to GitHub safely.

## Pre-Push Checks

### Step 1: Verify Current State
- Run `git status` to check for uncommitted changes
- If uncommitted changes exist, suggest running `/safe-commit` first
- Run `git branch --show-current` to confirm current branch

### Step 2: Verify Commits
- Run `git log --oneline -5` to show recent commits
- Ask user to confirm these commits are ready to push

### Step 3: Pull Latest Changes
Before pushing, check if remote has updates:
```bash
git fetch origin
```

Check if there are remote changes that need to be merged:
- If remote branch exists and has changes, suggest pulling first
- If conflicts might occur, warn the user

## Push Process

### Step 4: Push Branch
```bash
git push origin [branch-name]
```

If this is the first push of a new branch:
```bash
git push -u origin [branch-name]
```

### Step 5: Next Steps
After successful push, ask the user what they want to do:

**Option A: Create Pull Request** (Recommended for review)
- Guide them to create a PR on GitHub
- PR from `[feature-branch]` → `main`
- Remind them to add description of changes

**Option B: Merge Directly to Main** (For quick changes)
- Suggest running `/merge-to-main` command

**Option C: Continue Development**
- They can make more commits to this branch
- Each new push will update the remote branch

**Option D: Deploy** (If already merged to main)
- Run `/deploy` to deploy to production

## Safety Reminders
- ⚠️ Pushing to GitHub does NOT deploy to production
- Production deployment is a separate step (`/deploy`)
- Always verify changes in the pushed branch before merging to main
