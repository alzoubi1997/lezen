# Quick Vercel Setup - Fix "Database niet geconfigureerd" Error

## The Problem
You're seeing: **"Database niet geconfigureerd. Voeg DATABASE_URL toe in Vercel Environment Variables."**

This means `DATABASE_URL` is not set in your Vercel project.

## Quick Fix (5 minutes)

### Step 1: Create a PostgreSQL Database

**Option A: Vercel Postgres (Easiest)**
1. Go to https://vercel.com
2. Open your project
3. Click **"Storage"** tab
4. Click **"Create Database"**
5. Select **"Postgres"**
6. Choose a name (e.g., "lezen-db")
7. Click **"Create"**
8. **Copy the connection string** (it will be shown after creation)

**Option B: Supabase (Free alternative)**
1. Go to https://supabase.com and sign up
2. Create a new project
3. Wait 2-3 minutes for it to be ready
4. Go to **Settings** → **Database**
5. Copy the **"URI"** connection string

### Step 2: Add DATABASE_URL to Vercel

1. In Vercel, go to your project
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Click **"Add New"**
5. **Name:** `DATABASE_URL`
6. **Value:** Paste the connection string you copied
7. **Important:** Check all three boxes:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
8. Click **"Save"**

### Step 3: Add SESSION_SECRET (if not already set)

1. Still in **Environment Variables**
2. Click **"Add New"** again
3. **Name:** `SESSION_SECRET`
4. **Value:** Generate a random string (see below)
5. Check all three boxes (Production, Preview, Development)
6. Click **"Save"**

**Generate SESSION_SECRET:**
- PowerShell: `-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})`
- Or use: https://generate-secret.vercel.app/32

### Step 4: Redeploy

1. Go to **"Deployments"** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Run Database Migrations

After redeploy, you need to set up the database tables:

**Using Vercel CLI (recommended):**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# Pull environment variables
vercel env pull

# Run migrations
npx prisma migrate deploy
```

**Or manually via Vercel:**
- The migrations will run automatically if you have a `postinstall` script, but you may need to run them manually the first time.

### Step 6: Test

1. Visit your Vercel URL
2. Try to create a profile
3. If it works, you're done! ✅

## Still Having Issues?

1. **Check Vercel Logs:**
   - Go to Deployments → Latest → Functions → View Logs
   - Look for `[CREATE-PROFILE]` or `[LOGIN]` logs

2. **Test Health Endpoint:**
   - Visit: `https://your-app.vercel.app/api/health`
   - This will show database connection status

3. **Verify Environment Variables:**
   - Make sure `DATABASE_URL` is set for **Production** environment
   - The connection string should start with `postgresql://` or `postgres://`

## Need Help?

- Check `DATABASE_SETUP.md` for detailed instructions
- Check Vercel build logs for specific errors
- Make sure your Prisma schema uses `provider = "postgresql"` (not `sqlite`)

