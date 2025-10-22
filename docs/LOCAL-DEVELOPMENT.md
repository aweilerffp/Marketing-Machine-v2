# Local Development Guide

## Overview

This guide walks you through setting up the Marketing Machine on your local machine for development and testing.

## Prerequisites

### Required Software

1. **Node.js** 18 or higher
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** 14 or higher
   - **macOS**: `brew install postgresql@14`
   - **Windows**: https://www.postgresql.org/download/windows/
   - **Linux**: `sudo apt install postgresql postgresql-contrib`
   - Verify: `psql --version`

3. **Redis** 6 or higher
   - **macOS**: `brew install redis`
   - **Windows**: https://github.com/microsoftarchive/redis/releases
   - **Linux**: `sudo apt install redis-server`
   - Verify: `redis-cli --version`

4. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

### API Keys (Development)

You'll need development API keys for:
- **Anthropic Claude** (https://console.anthropic.com/)
- **Clerk** (https://clerk.com/)
- **LinkedIn Developer App** (https://www.linkedin.com/developers/)
- **Read.ai** (optional for local testing)

## Initial Setup

### 1. Clone the Repository

```bash
# Clone to your local machine
git clone https://github.com/aweilerffp/Marketing-Machine-v2.git
cd Marketing-Machine-v2
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Set Up Environment Variables

```bash
# Create local environment file
cd backend
cp .env.local.example .env.local
```

Edit `backend/.env.local` with your development credentials:

```bash
# Database (will be set by import script)
DATABASE_URL="postgresql://postgres@localhost:5432/marketing_machine_dev"

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Authentication (dev mode bypass)
ALLOW_AUTH_BYPASS=true
DEV_USER_ID=dev_user_123

# Clerk (use test/dev keys)
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_DEV_KEY
CLERK_SECRET_KEY=sk_test_YOUR_DEV_SECRET

# Anthropic Claude (dev key with limits)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_DEV_KEY
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=2500
CLAUDE_TEMPERATURE=0.8

# LinkedIn (dev app)
LINKEDIN_CLIENT_ID=your_dev_client_id
LINKEDIN_CLIENT_SECRET=your_dev_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/api/auth/linkedin/callback

# Redis
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

Frontend `.env.local`:
```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_DEV_KEY
```

### 4. Import Production Database (Recommended)

Get a sanitized copy of the production database for realistic testing:

```bash
# On production server, export database
ssh root@your-server
cd /root/marketing-machine
./scripts/export-db-snapshot.sh /tmp/db-snapshot.sql

# Download to your local machine
exit  # Exit SSH
scp root@your-server:/tmp/db-snapshot.sql ~/Downloads/

# Import to local PostgreSQL
cd ~/path/to/Marketing-Machine-v2
./scripts/import-db-snapshot.sh ~/Downloads/db-snapshot.sql
```

The import script will:
- Create `marketing_machine_dev` database
- Import all tables and data
- Update `DATABASE_URL` in `.env.local`
- Sanitize sensitive data (API keys, tokens)

### 5. Alternative: Use Mock Data

If you don't need production data:

```bash
cd backend

# Create database
createdb marketing_machine_dev

# Run migrations
npx prisma migrate dev

# Seed with mock data (optional)
npm run seed
```

## Running Locally

### Start Backend

```bash
# Terminal 1
cd backend

# Start PostgreSQL (if not running)
# macOS: brew services start postgresql@14
# Linux: sudo service postgresql start

# Start Redis (if not running)
# macOS: brew services start redis
# Linux: sudo service redis-server start

# Start backend in dev mode (with hot reload)
npm run dev
```

Backend will run on http://localhost:3001

### Start Frontend

```bash
# Terminal 2
cd frontend

# Start frontend dev server
npm run dev
```

Frontend will run on http://localhost:5173

### Verify Everything Works

1. Open browser to http://localhost:5173
2. You should see the Marketing Machine login page
3. Check browser console for errors
4. Check terminal for backend logs

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in your code editor

3. **Test locally:**
   - Backend: `npm run dev`
   - Frontend: `npm run dev`
   - Check for errors

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to GitHub:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request** on GitHub (or merge to main for auto-deploy)

### Testing with Real Data

Periodically update your local database with fresh production data:

```bash
# On server
ssh root@your-server
cd /root/marketing-machine
./scripts/export-db-snapshot.sh /tmp/db-snapshot.sql

# On local
scp root@your-server:/tmp/db-snapshot.sql ~/Downloads/
./scripts/import-db-snapshot.sh ~/Downloads/db-snapshot.sql
```

### Database Migrations

When you change the Prisma schema:

```bash
cd backend

# Create a migration
npx prisma migrate dev --name describe_your_change

# This will:
# - Generate SQL migration file
# - Apply migration to local database
# - Regenerate Prisma Client

# Commit migration files
git add prisma/migrations/
git commit -m "Add migration: describe_your_change"
```

## Common Tasks

### Reset Database

```bash
cd backend
npx prisma migrate reset
# This will drop database, run all migrations, and seed
```

### View Database

```bash
# Use Prisma Studio (GUI)
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Check Logs

```bash
# Backend logs appear in terminal
# Frontend logs appear in browser console
```

### Update Dependencies

```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm run dev
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS: brew services start postgresql@14
# Linux: sudo service postgresql start

# Check connection
psql -U postgres -d marketing_machine_dev -c "SELECT 1"
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
# macOS: brew services start redis
# Linux: sudo service redis-server start
```

### Prisma Errors

```bash
# Regenerate Prisma Client
cd backend
npx prisma generate

# Reset database
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

1. ✅ **Always use feature branches** for development
2. ✅ **Test locally before pushing** to main
3. ✅ **Keep dependencies updated** regularly
4. ✅ **Use development API keys** with usage limits
5. ✅ **Never commit `.env.local`** files
6. ✅ **Sync database weekly** for realistic testing
7. ⚠️ **Don't test webhooks locally** (use ngrok or staging)
8. ⚠️ **Don't modify production data** from local machine

## IDE Setup

### VS Code Extensions (Recommended)

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Prisma** - Prisma schema support
- **GitLens** - Git integration
- **TypeScript Vue Plugin (Volar)** - Vue/React support
- **Thunder Client** - API testing

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Anthropic Documentation](https://docs.anthropic.com/)

## Getting Help

1. Check existing GitHub Issues
2. Review deployment logs
3. Ask in team chat
4. Create new GitHub Issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant logs/screenshots
