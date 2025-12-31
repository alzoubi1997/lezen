# Problem Analysis & Solution Steps

## Overview
This document analyzes all problems encountered during development and provides step-by-step solutions.

---

## Problem 1: Prisma Schema - Enum Support in SQLite

### Root Cause
- **Issue**: Prisma schema initially used `enum` types (`QuestionType`, `WrongReasonTag`)
- **Problem**: SQLite doesn't support Prisma enums
- **Error**: `Error validating: You defined the enum QuestionType. But the current connector does not support enums.`

### Solution Applied
✅ Changed enums to `String` types in `prisma/schema.prisma`
✅ Updated `lib/types.ts` to use string literals instead of enum types
✅ Updated `prisma/seed.ts` to use string values

### Status: **FIXED**

---

## Problem 2: Missing Environment Variables

### Root Cause
- **Issue**: No `.env` file exists
- **Problem**: `DATABASE_URL` is required by Prisma but not set
- **Impact**: Database connection fails, Prisma client errors

### Solution Steps
1. Create `.env` file with `DATABASE_URL="file:./dev.db"`
2. Ensure database file exists or create it via migration

### Status: **NEEDS FIX**

---

## Problem 3: next-intl Server-Side Rendering Issues

### Root Cause
- **Issue**: `getLocale()` and `getMessages()` from `next-intl/server` failing during SSR
- **Problem**: Server components can't reliably access next-intl server functions
- **Error**: Various hydration and rendering errors

### Solution Applied
✅ Modified `app/layout.tsx` to:
   - Read locale directly from cookies
   - Load messages directly from JSON files
   - Bypass next-intl server functions
   - Added comprehensive error handling and fallbacks

✅ Modified `i18n/request.ts` to:
   - Use direct cookie reading
   - Add error handling with fallbacks

✅ Modified `components/Layout.tsx` and `components/AuthModal.tsx` to:
   - Use fallback translations
   - Handle missing translation context gracefully

### Status: **FIXED**

---

## Problem 4: Hydration Mismatch in not-found.tsx

### Root Cause
- **Issue**: `not-found.tsx` had hardcoded Dutch text
- **Problem**: Server rendered Arabic (based on locale cookie), client rendered Dutch
- **Error**: `Text content does not match server-rendered HTML. Server: "الصفحة غير موجودة" Client: "Pagina niet gevonden"`

### Solution Applied
✅ Made `not-found.tsx` an async server component
✅ Reads locale from cookies (same as layout)
✅ Renders appropriate language based on locale

### Status: **FIXED**

---

## Problem 5: Database Not Initialized/Seeded

### Root Cause
- **Issue**: Database might exist but not be seeded with content
- **Problem**: App needs models, texts, and questions to function
- **Impact**: Empty app, no content to display

### Solution Steps
1. Verify database exists
2. Run migrations if needed
3. Seed database with initial content

### Status: **NEEDS VERIFICATION**

---

## Problem 6: Middleware Configuration

### Root Cause
- **Issue**: `next-intl` middleware might conflict with custom locale handling
- **Problem**: Locale cookie might not be set correctly on first visit

### Solution Applied
✅ Modified `middleware.ts` to:
   - Set locale cookie if not present
   - Handle errors gracefully
   - Default to 'nl' if cookie missing

### Status: **FIXED**

---

## Complete Solution Steps

### Step 1: Create Environment File
```bash
# Create .env file with:
DATABASE_URL="file:./dev.db"
```

### Step 2: Verify Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed database (adds content)
npm run db:seed
```

### Step 3: Clear Build Cache
```bash
# Remove .next folder to clear cache
rm -rf .next
# Or on Windows:
Remove-Item -Recurse -Force .next
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

### Step 5: Test Application Flow
1. Navigate to `http://localhost:3000`
2. Should redirect to `/auth` if not logged in
3. Create a profile or login
4. Should see home page with "Oefenen" and "Examen" cards
5. Test language toggle (Dutch ↔ Arabic)
6. Test explanation toggle

---

## Current Status Summary

| Issue | Status | Action Required |
|-------|--------|------------------|
| Prisma Enums | ✅ Fixed | None |
| Environment Variables | ⚠️ Needs Fix | Create .env file |
| next-intl SSR | ✅ Fixed | None |
| Hydration Mismatch | ✅ Fixed | None |
| Database Seeding | ⚠️ Needs Verification | Run seed script |
| Middleware | ✅ Fixed | None |

---

## Next Steps to Get Website Working

1. **Create .env file** (if missing)
2. **Verify database is seeded** (run `npm run db:seed`)
3. **Clear .next cache** (remove build folder)
4. **Restart dev server** (`npm run dev`)
5. **Test complete flow** (auth → home → models → attempt)

---

## Testing Checklist

- [ ] Environment file exists with DATABASE_URL
- [ ] Database is seeded (check with `npm run db:studio`)
- [ ] Dev server starts without errors
- [ ] Home page loads (redirects to /auth if not logged in)
- [ ] Auth modal works (create profile and login)
- [ ] Language toggle works (Dutch ↔ Arabic)
- [ ] Explanation toggle works
- [ ] Models page loads
- [ ] Can start an attempt
- [ ] Results page displays correctly
- [ ] PDF downloads work

