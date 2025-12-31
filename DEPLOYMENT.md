# Vercel Deployment Guide

## Step-by-Step Deployment Instructions

### Prerequisites
1. A GitHub account
2. A Vercel account (sign up at https://vercel.com)
3. A PostgreSQL database (we'll set this up)

---

## Step 1: Prepare Your Code

1. **Make sure your code is ready:**
   ```bash
   # Test build locally first
   npm run build
   ```

2. **Push your code to GitHub:**
   ```bash
   git init  # if not already a git repo
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## Step 2: Set Up PostgreSQL Database

You have 3 options:

### Option A: Vercel Postgres (Recommended - Easiest)
1. Go to your Vercel dashboard
2. Click on your project → **Storage** tab
3. Click **Create Database** → Select **Postgres**
4. Choose a name and region
5. Copy the connection string (you'll need it in Step 3)

### Option B: Supabase (Free tier available)
1. Go to https://supabase.com
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (looks like: `postgresql://...`)

### Option C: Railway (Free tier available)
1. Go to https://railway.app
2. Create a new project → Add **PostgreSQL**
3. Copy the connection string from the **Variables** tab

---

## Step 3: Update Prisma Schema for PostgreSQL

**IMPORTANT:** You need to change from SQLite to PostgreSQL:

1. **Edit `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Create a new migration:**
   ```bash
   npx prisma migrate dev --name switch_to_postgresql
   ```

---

## Step 4: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Easiest)

1. **Go to https://vercel.com and sign in**

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select your repository
   - Click **Import**

4. **Configure the project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

5. **Add Environment Variables:**
   Click **Environment Variables** and add:
   
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```
   (Use the connection string from Step 2)
   
   ```
   SESSION_SECRET=your-random-secret-string-here
   ```
   (Generate a random string, e.g., use: `openssl rand -base64 32`)
   
   ```
   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   ```
   (Will be your Vercel URL after deployment)

6. **Click "Deploy"**

### Method 2: Via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variables:**
   ```bash
   vercel env add DATABASE_URL
   vercel env add SESSION_SECRET
   vercel env add NEXT_PUBLIC_APP_URL
   ```

---

## Step 5: Run Database Migrations

After deployment, you need to run migrations on the production database:

1. **Pull environment variables:**
   ```bash
   vercel env pull .env.production
   ```

2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

   Or if using Vercel CLI:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

---

## Step 6: Seed the Database

Run the seed script to populate your database with content:

```bash
# Make sure DATABASE_URL points to production
npx prisma db seed
```

Or use Vercel's environment:
```bash
vercel env pull
npm run db:seed
```

---

## Step 7: Verify Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Test the application:
   - Create a profile
   - Start an exam/practice
   - Check dashboard
   - Test PDF downloads

---

## Troubleshooting

### Issue: Build fails
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify `next.config.js` is correct

### Issue: Database connection errors
- Verify `DATABASE_URL` is correct in Vercel environment variables
- Check if database allows connections from Vercel IPs
- For Supabase: Check **Settings** → **Database** → **Connection Pooling**

### Issue: Migrations fail
- Make sure you changed `provider = "postgresql"` in schema.prisma
- Run `npx prisma generate` before deploying
- Check database credentials are correct

### Issue: App works but no content
- Run the seed script: `npm run db:seed`
- Check database in Prisma Studio: `npx prisma studio`

---

## Important Notes

1. **SQLite → PostgreSQL:** You MUST change the database provider in `prisma/schema.prisma`
2. **Environment Variables:** Never commit `.env` file to Git
3. **Database Seeding:** Run seed script after first deployment
4. **Migrations:** Always run `prisma migrate deploy` after schema changes

---

## Quick Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] Prisma schema updated to `postgresql`
- [ ] Environment variables set in Vercel
- [ ] Project deployed to Vercel
- [ ] Migrations run on production database
- [ ] Database seeded with content
- [ ] Application tested and working

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Check build logs in Vercel dashboard for errors

