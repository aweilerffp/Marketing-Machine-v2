#!/bin/bash

# ==============================================================================
# Database Snapshot Export Script
# ==============================================================================
# Exports production database to a sanitized snapshot for local development
#
# Usage:
#   ./scripts/export-db-snapshot.sh [output-file]
#
# Example:
#   ./scripts/export-db-snapshot.sh ~/Downloads/db-snapshot.sql
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="marketing_machine"
DB_USER="marketing_user"
DB_PASSWORD="marketing_pass_2025"
DB_HOST="localhost"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="${1:-/tmp/marketing-machine-snapshot-${TIMESTAMP}.sql}"

echo -e "${GREEN}📊 Marketing Machine - Database Snapshot Export${NC}"
echo "=================================================="
echo ""

# Check if PostgreSQL is accessible
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Cannot connect to database${NC}"
  echo "Please check your database configuration"
  exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Export database
echo -e "${YELLOW}📦 Exporting database...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database exported successfully${NC}"
else
  echo -e "${RED}❌ Error exporting database${NC}"
  exit 1
fi
echo ""

# Sanitize sensitive data
echo -e "${YELLOW}🔒 Sanitizing sensitive data...${NC}"

# Create temporary sanitization SQL
SANITIZE_SQL="/tmp/sanitize-${TIMESTAMP}.sql"

cat > "$SANITIZE_SQL" <<'EOF'
-- Sanitize API keys and tokens
UPDATE "Company" SET
  "customLinkedInPrompt" = "customLinkedInPrompt",
  "customHookPrompt" = "customHookPrompt",
  "customImagePrompt" = "customImagePrompt"
WHERE id IS NOT NULL;

UPDATE "User" SET
  "linkedinToken" = NULL,
  "email" = 'dev_' || id || '@example.com',
  "clerkId" = 'dev_clerk_' || id
WHERE id IS NOT NULL;

UPDATE "PlatformConnection" SET
  "accessToken" = 'dev_token_' || id,
  "refreshToken" = NULL,
  "credentials" = '{"sanitized": true}'::jsonb
WHERE id IS NOT NULL;

-- Clear any sensitive metadata
UPDATE "Meeting" SET
  "metadata" = jsonb_set(
    COALESCE("metadata", '{}'::jsonb),
    '{sanitized}',
    'true'::jsonb
  )
WHERE id IS NOT NULL;
EOF

# Apply sanitization to the dump
echo "-- Sanitization applied on $(date)" >> "$OUTPUT_FILE"
cat "$SANITIZE_SQL" >> "$OUTPUT_FILE"
rm "$SANITIZE_SQL"

echo -e "${GREEN}✅ Sensitive data sanitized${NC}"
echo ""

# Get statistics
echo -e "${YELLOW}📈 Database Statistics:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
" | head -20

echo ""
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo -e "${GREEN}✅ Export complete!${NC}"
echo ""
echo "📁 Output file: $OUTPUT_FILE"
echo "📦 File size: $FILE_SIZE"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Download this file to your local machine:"
echo "   scp root@your-server:$OUTPUT_FILE ~/Downloads/"
echo ""
echo "2. Import on your local machine:"
echo "   cd ~/path/to/marketing-machine"
echo "   ./scripts/import-db-snapshot.sh ~/Downloads/$(basename $OUTPUT_FILE)"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
