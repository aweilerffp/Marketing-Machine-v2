#!/bin/bash

# ==============================================================================
# Database Snapshot Import Script (LOCAL DEVELOPMENT)
# ==============================================================================
# Imports a sanitized production database snapshot to local PostgreSQL
#
# Usage:
#   ./scripts/import-db-snapshot.sh <snapshot-file>
#
# Example:
#   ./scripts/import-db-snapshot.sh ~/Downloads/db-snapshot.sql
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if snapshot file is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: No snapshot file specified${NC}"
  echo ""
  echo "Usage: $0 <snapshot-file>"
  echo "Example: $0 ~/Downloads/db-snapshot.sql"
  exit 1
fi

SNAPSHOT_FILE="$1"

# Check if file exists
if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo -e "${RED}❌ Error: File not found: $SNAPSHOT_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}📊 Marketing Machine - Database Snapshot Import${NC}"
echo "=================================================="
echo ""

# Configuration (adjust these for your local setup)
DB_NAME="marketing_machine_dev"
DB_USER="${DB_USER:-postgres}"  # Default to postgres, override with env var
DB_HOST="${DB_HOST:-localhost}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Snapshot: $SNAPSHOT_FILE"
echo ""

# Ask for confirmation
read -p "⚠️  This will REPLACE your local database. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}❌ Import cancelled${NC}"
  exit 0
fi
echo ""

# Check PostgreSQL connection
echo -e "${YELLOW}🔍 Checking PostgreSQL connection...${NC}"
if ! psql -h $DB_HOST -U $DB_USER -d postgres -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Cannot connect to PostgreSQL${NC}"
  echo ""
  echo "Please ensure:"
  echo "  1. PostgreSQL is installed and running"
  echo "  2. User '$DB_USER' exists with proper permissions"
  echo "  3. You can connect without a password (use .pgpass or trust auth)"
  echo ""
  exit 1
fi
echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
echo ""

# Drop and recreate database
echo -e "${YELLOW}🗑️  Dropping existing database (if exists)...${NC}"
psql -h $DB_HOST -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

echo -e "${YELLOW}🆕 Creating new database...${NC}"
psql -h $DB_HOST -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
echo -e "${GREEN}✅ Database created${NC}"
echo ""

# Import snapshot
echo -e "${YELLOW}📥 Importing snapshot...${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < "$SNAPSHOT_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Snapshot imported successfully${NC}"
else
  echo -e "${RED}❌ Error importing snapshot${NC}"
  exit 1
fi
echo ""

# Update connection string in .env.local
echo -e "${YELLOW}📝 Updating .env.local...${NC}"
cd "$(dirname "$0")/../backend"

if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local not found, creating from example...${NC}"
  cp .env.local.example .env.local
fi

# Update DATABASE_URL in .env.local
CONNECTION_STRING="postgresql://${DB_USER}@${DB_HOST}:5432/${DB_NAME}"
if grep -q "^DATABASE_URL=" .env.local; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$CONNECTION_STRING\"|" .env.local
else
  echo "DATABASE_URL=\"$CONNECTION_STRING\"" >> .env.local
fi

echo -e "${GREEN}✅ DATABASE_URL updated in .env.local${NC}"
echo ""

# Get statistics
echo -e "${YELLOW}📈 Database Statistics:${NC}"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT
  schemaname,
  tablename,
  n_tup_ins as rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;
" 2>/dev/null || echo "Statistics not available yet (run the app first)"

echo ""
echo -e "${GREEN}✅ Import complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update other credentials in backend/.env.local:"
echo "   - ANTHROPIC_API_KEY (use your dev key)"
echo "   - CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY (dev keys)"
echo "   - LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET (dev app)"
echo ""
echo "2. Run Prisma migrations:"
echo "   cd backend && npx prisma migrate dev"
echo ""
echo "3. Start the development server:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo -e "${GREEN}✅ All done! Happy coding! 🚀${NC}"
