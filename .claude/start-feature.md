# Start New Feature Workflow

You are helping the user start a new feature for the Marketing Machine project.

## IMPORTANT RULES
1. **NEVER develop directly on production server** (root@5.78.155.116)
2. **ALWAYS work locally first** at /Users/adamweiler/Documents/BMAD/marketing-machine
3. **ALWAYS create a feature branch** - never commit directly to main
4. **ALWAYS check git status** before starting

## Workflow Steps

### Step 1: Verify Current State
First, check the current git status and branch:
- Run `git status` to see current branch and any uncommitted changes
- If there are uncommitted changes, ask the user what to do with them:
  - Commit them first?
  - Stash them?
  - Discard them?

### Step 2: Update Main Branch
Ensure main branch is up to date:
```bash
git checkout main
git pull origin main
```

### Step 3: Create Feature Branch
Ask the user what type of change this is:
- **feature/** - New functionality (e.g., feature/linkedin-auth-improvements)
- **fix/** - Bug fix (e.g., fix/meeting-card-rendering)
- **enhancement/** - Improvement to existing feature (e.g., enhancement/dashboard-metrics)
- **refactor/** - Code refactoring (e.g., refactor/api-structure)

Then ask for a brief descriptive name (kebab-case, lowercase).

Create the branch:
```bash
git checkout -b [type]/[descriptive-name]
```

### Step 4: Remind About Development Servers
Remind the user they may want to start development servers:
- **Backend**: `cd backend && npm run dev`
- **Frontend**: `cd frontend && npm run dev`

### Step 5: Ready to Code
Confirm the feature branch is ready and the user can now make changes.

## After Running This Command
- User should make their code changes
- Test locally
- Then run `/safe-commit` when ready to commit
