# Merge Feature to Main Branch

You are helping the user merge their feature branch into main.

## ⚠️ IMPORTANT PRE-MERGE CHECKS

### Step 1: Confirm Testing
Ask the user explicitly:
- "Have you tested all changes locally?"
- "Are you confident this code is production-ready?"
- If NO to either, STOP and recommend more testing first

### Step 2: Verify Current Branch
- Run `git branch --show-current`
- Should be on a feature branch (not main)
- If already on main, ask if they want to merge another branch

### Step 3: Check Uncommitted Changes
- Run `git status`
- If uncommitted changes exist, must commit first (`/safe-commit`)

### Step 4: Update Main First
Before merging, ensure main is up to date:
```bash
git checkout main
git pull origin main
```

### Step 5: Check for Conflicts
- Run `git log main..[feature-branch] --oneline` to see what will be merged
- Show the user the commits that will be added to main

## Merge Process

### Step 6: Perform Merge
```bash
git merge [feature-branch]
```

### Step 7: Handle Conflicts (if any)
If conflicts occur:
- Show the conflicted files
- Guide user through resolution:
  1. Open conflicted files
  2. Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
  3. Resolve conflicts manually
  4. Run `git add [resolved-files]`
  5. Run `git commit` to complete merge

### Step 8: Push to GitHub
After successful merge:
```bash
git push origin main
```

### Step 9: Cleanup (Optional)
Ask if they want to delete the feature branch:
```bash
# Delete local branch
git branch -d [feature-branch]

# Delete remote branch
git push origin --delete [feature-branch]
```

## Next Steps

After merge is complete, ask:
1. **Deploy to Production?** Run `/deploy`
2. **Start New Feature?** Run `/start-feature`
3. **Done for now?** All changes are now in main and on GitHub

## Safety Notes
- ⚠️ Merging to main does NOT automatically deploy to production
- Production deployment is a separate manual step
- Always ensure changes are tested before deploying
