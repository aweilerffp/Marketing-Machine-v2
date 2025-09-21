#!/bin/bash

# Read the fixed prompt content and escape quotes for SQLite
PROMPT_CONTENT=$(cat fixed_prompt.txt | sed "s/'/''/g")

# Update the database for the correct user ID
DATABASE_URL="file:./prisma/dev.db" sqlite3 ./prisma/dev.db "
UPDATE Company 
SET customLinkedInPrompt = '$PROMPT_CONTENT'
WHERE userId = 'cmfsp159b000bnwdsik5gkx9p';

-- Verify the update
SELECT 'Update completed for user:' as status, name, length(customLinkedInPrompt) as prompt_length 
FROM Company 
WHERE userId = 'cmfsp159b000bnwdsik5gkx9p';
"

echo "✅ LinkedIn prompt updated for correct user!"