# Database Setup Guide - Simple Steps

## What is DATABASE_URL?

DATABASE_URL is like an address that tells your app where to find and connect to your database. It's a connection string that contains:
- Database type (PostgreSQL)
- Username and password
- Server location
- Database name

## Step-by-Step Setup (Easiest Method)

### Option 1: Vercel Postgres (Recommended - 5 minutes)

1. **Go to your Vercel project:**
   - Visit: https://vercel.com/imads-projects-6fc207f6/lezen
   - Or go to https://vercel.com → Your project → **Storage** tab

2. **Create a PostgreSQL database:**
   - Click **"Create Database"** button
   - Select **"Postgres"**
   - Choose a name (e.g., "lezen-db")
   - Select a region (choose closest to you)
   - Click **"Create"**

3. **Copy the connection string:**
   - After creation, you'll see a connection string that looks like:
     ```
     postgres://default:xxxxx@xxxxx.vercel-storage.com:5432/verceldb
     ```
   - Click **"Copy"** to copy it

4. **Add it to Environment Variables:**
   - Go to: **Settings** → **Environment Variables**
   - Click **"Add New"**
   - Name: `DATABASE_URL`
   - Value: Paste the connection string you copied
   - Select: **Production**, **Preview**, and **Development** (check all three)
   - Click **"Save"**

5. **Add SESSION_SECRET:**
   - Click **"Add New"** again
   - Name: `SESSION_SECRET`
   - Value: Generate a random string (see below)
   - Select: **Production**, **Preview**, and **Development**
   - Click **"Save"**

6. **Generate SESSION_SECRET:**
   - Open PowerShell (Windows) or Terminal (Mac/Linux)
   - Run this command:
     ```powershell
     # Windows PowerShell:
     -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
     
     # Or use this online tool:
     # https://generate-secret.vercel.app/32
     ```
   - Copy the generated string and use it as SESSION_SECRET

7. **Redeploy:**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **"Redeploy"**

---

### Option 2: Supabase (Free, 10 minutes)

1. **Create account:**
   - Go to https://supabase.com
   - Sign up (free)

2. **Create project:**
   - Click **"New Project"**
   - Choose organization
   - Project name: "lezen"
   - Database password: (create a strong password - save it!)
   - Region: (choose closest)
   - Click **"Create new project"**

3. **Get connection string:**
   - Wait 2-3 minutes for project to be ready
   - Go to **Settings** → **Database**
   - Scroll to **"Connection string"**
   - Copy the **"URI"** connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

4. **Add to Vercel:**
   - Go to your Vercel project → **Settings** → **Environment Variables**
   - Add `DATABASE_URL` with the connection string from Supabase
   - Add `SESSION_SECRET` (generate using method above)
   - Redeploy

---

## After Setup

Once you've added DATABASE_URL and SESSION_SECRET:

1. **The build will succeed** ✅
2. **You need to run database migrations:**
   - Go to Vercel project → **Deployments**
   - Click on the latest deployment
   - Go to **"Functions"** tab
   - Or use Vercel CLI (if you have it installed):
     ```bash
     vercel env pull
     npx prisma migrate deploy
     ```

3. **Seed the database** (add initial data):
   - You can do this via Vercel CLI or create a one-time script

---

## Quick Checklist

- [ ] Created PostgreSQL database (Vercel Postgres or Supabase)
- [ ] Copied connection string
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Generated and added `SESSION_SECRET` to Vercel environment variables
- [ ] Redeployed the project
- [ ] Build succeeded ✅

---

## Need Help?

If you get stuck:
1. Check Vercel build logs for errors
2. Make sure DATABASE_URL starts with `postgresql://` or `postgres://`
3. Make sure SESSION_SECRET is a random string (at least 32 characters)
4. Make sure both variables are added for **Production**, **Preview**, and **Development**

