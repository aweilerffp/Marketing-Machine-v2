# Safe Commit Workflow

You are helping the user commit their changes safely with proper git practices.

## IMPORTANT SAFETY CHECKS

### Pre-Commit Checklist
Before committing, verify:

1. **Location Check**: Confirm user is on their LOCAL machine, not production server
2. **Branch Check**:
   - Run `git branch --show-current`
   - ⚠️ **WARNING**: If on `main` branch, STOP and ask if they meant to create a feature branch first
   - Suggest: "You're on main. Should we create a feature branch instead? (Run `/start-feature`)"

3. **Status Check**:
   - Run `git status` to see what will be committed
   - Show the user the files that will be committed
   - **CRITICAL**: Check for sensitive files:
     - `.env` files (should be in .gitignore)
     - `credentials.json` or similar
     - API keys or secrets
     - If found, WARN the user and suggest adding to .gitignore

4. **Test Reminder**:
   - Ask: "Have you tested these changes locally?"
   - Remind them to verify both frontend and backend if applicable

## Commit Process

### Step 1: Review Changes
Show the user:
- Files to be staged: `git status`
- Actual changes: `git diff` (summary)

### Step 2: Stage Changes
Ask user which files to stage (or all):
```bash
git add .
# or specific files
git add path/to/file
```

### Step 3: Create Commit Message
Help craft a good commit message following convention:
- **feat:** New feature
- **fix:** Bug fix
- **enhancement:** Improvement to existing feature
- **refactor:** Code refactoring
- **docs:** Documentation changes
- **chore:** Maintenance tasks

Format:
```
[type]: Brief description (50 chars or less)

Optional longer explanation if needed
```

Example: `feat: Add LinkedIn token refresh functionality`

### Step 4: Commit
```bash
git commit -m "your message here"
```

### Step 5: Next Steps
After committing, ask the user:
1. "Ready to push to GitHub? (Run `/push-feature`)"
2. "Need to make more changes on this branch?"
3. "Ready to deploy? (Run `/deploy`)"

## Red Flags to Watch For
- Committing directly to `main` without explicit intention
- Committing `.env` or credential files
- Very large commits (suggest breaking up)
- Vague commit messages like "updates" or "fixes"
