#!/bin/bash

# Read the fixed prompt content and escape quotes for SQLite
PROMPT_CONTENT=$(cat fixed_prompt.txt | sed "s/'/''/g")

# Update the database directly
DATABASE_URL="file:./prisma/dev.db" sqlite3 ./prisma/dev.db "
UPDATE Company 
SET customLinkedInPrompt = '$PROMPT_CONTENT'
WHERE id = 'cmfcxem0r000inwbq5bf4knlf';

-- Verify the update
SELECT 'Update completed for company:' as status, name, length(customLinkedInPrompt) as prompt_length 
FROM Company 
WHERE id = 'cmfcxem0r000inwbq5bf4knlf';
"

echo "✅ LinkedIn prompt updated successfully!"