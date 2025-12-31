# NT2 Lezen Training App

A professional bilingual (Arabic/Dutch) mobile-first web application for Dutch NT2 Lezen exam training at B2+/C1 level.

## Features

- **Bilingual Support**: Full UI and explanations in Dutch and Arabic with RTL support
- **Exam Simulation**: Timed sessions (100 min for exams, 30 min for practice)
- **Progress Tracking**: Dashboard with analytics and error notebook
- **PDF Export**: Full and wrong-questions-only PDF downloads
- **Profile System**: Simple Profile ID + PIN authentication (no email required)
- **Original Content**: B2+/C1 level Dutch texts and questions

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)
- next-intl for internationalization
- pdf-lib for PDF generation
- bcrypt for PIN hashing

## Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL="file:./dev.db"`

3. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database:**
   ```bash
   npm run db:seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## Production Deployment (Vercel + PostgreSQL)

1. **Set up PostgreSQL database:**
   - Create a PostgreSQL database (e.g., on Vercel Postgres, Supabase, or Railway)
   - Get the connection string

2. **Configure environment variables in Vercel:**
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A random string for session security
   - `NEXT_PUBLIC_APP_URL`: Your production URL

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Run migrations:**
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

5. **Seed the database (one time):**
   ```bash
   npm run db:seed
   ```

## Database Commands

- `npm run db:migrate` - Create and apply migrations
- `npm run db:seed` - Seed the database with models and content
- `npm run db:studio` - Open Prisma Studio to view/edit data
- `npm run db:generate` - Generate Prisma Client

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── attempt/           # Exam/practice runner pages
│   ├── dashboard/         # Dashboard page
│   ├── errors/            # Error notebook page
│   └── models/            # Models listing page
├── components/            # React components
├── lib/                   # Utilities and helpers
├── messages/              # i18n translation files
├── prisma/                # Prisma schema and seed
└── hooks/                 # Custom React hooks
```

## Content Structure

- **Exam Models**: 2 exams (Examen 1, Examen 2)
  - Each: 6 texts, 35 questions total
  - Time: 100 minutes

- **Practice Models**: 3 practice sets (Oefening 1, 2, 3)
  - Each: 2 texts, 12 questions total
  - Time: 30 minutes

## Question Types

- INFO: Factual information questions
- MAIN_IDEA: Main idea identification
- INFERENCE: Inference and conclusion questions
- TONE: Author's tone and attitude
- INTENT: Author's purpose
- PARAPHRASE: Word/phrase meaning in context
- NEGATION: What is NOT mentioned

## License

This project is for educational purposes. All content is original and not based on copyrighted exam materials.

