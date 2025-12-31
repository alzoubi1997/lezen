# Quick Setup Instructions

## 1. Create .env file

Create a `.env` file in the root directory with:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-this-to-a-random-string-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 2. Run migrations (if not done)

```bash
npm run db:migrate
```

## 3. Seed database (optional)

```bash
npm run db:seed
```

## 4. Start dev server

```bash
npm run dev
```

The app will be available at http://localhost:3000

