# Dev Onboarding Bypass - Permanent Solution

## Problem
The brand voice onboarding was showing repeatedly even after completion due to inconsistent dev mode user/company association.

## Permanent Fixes Applied

### 1. Backend API Fix (`src/api/company/index.js`)
- Fixed dev mode logic to create proper dev user association
- Ensures `dev_user_123` gets assigned to existing company with brand voice data
- Prevents random company selection that caused inconsistent onboarding detection

### 2. Frontend Onboarding Detection (`src/hooks/useCompany.ts`)  
- Strengthened onboarding detection logic with better validation
- Added debug logging in development mode
- **PERMANENT BYPASS**: Added localStorage flags for development

### 3. Database Association
- Assigned `flatfilepro` company to `dev_user_123` in the database
- This ensures consistent company data for dev mode

## Emergency Bypass Methods

### Method 1: localStorage Flag (Permanent)
In browser console:
```javascript
localStorage.setItem('DEV_ONBOARDED', 'true')
```
OR
```javascript  
localStorage.setItem('SKIP_ONBOARDING', 'true')
```

### Method 2: Database Reset (if needed)
```sql
-- Assign existing company to dev user
UPDATE Company 
SET userId = (SELECT id FROM User WHERE clerkId = 'dev_user_123')
WHERE name = 'flatfilepro';
```

### Method 3: Force Company Creation (last resort)
```sql  
-- Create dev user if not exists
INSERT OR IGNORE INTO User (id, clerkId, email, createdAt, updatedAt) 
VALUES ('dev_user_123_id', 'dev_user_123', 'dev@example.com', datetime('now'), datetime('now'));

-- Create company for dev user  
INSERT INTO Company (id, userId, name, brandVoiceData, createdAt, updatedAt)
VALUES ('dev_company_id', 'dev_user_123_id', 'DevCorp', '{"industry":"Technology","targetAudience":"Developers"}', datetime('now'), datetime('now'));
```

## Code Locations (DO NOT REVERT)

1. **`backend/src/api/company/index.js`** - Lines 43-92: Dev mode user/company logic
2. **`frontend/src/hooks/useCompany.ts`** - Lines 82-90: localStorage bypass mechanism  
3. **`frontend/src/hooks/useCompany.ts`** - Lines 49-69: Robust onboarding detection

## Prevention
- The localStorage bypass is permanent and survives code changes
- The API logic creates proper associations automatically
- The database now has correct user-company relationships

**This issue should not recur if these files are not reverted.**