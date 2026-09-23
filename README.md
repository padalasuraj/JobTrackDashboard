# JobTrack

JobTrack is a full-stack job application tracking platform. It lets a user import a job URL, review extracted job data, manually correct missing fields, save the job, mark it as applied, and manage the application lifecycle with statuses, resumes, profiles, interviews, reminders, notes, filters, search and analytics.

## Tech Stack

- Next.js App Router, React, TypeScript
- Prisma ORM
- Local SQLite default for development through `DATABASE_URL=file:./dev.db`
- PostgreSQL-ready schema design for hosted databases such as Supabase, Neon, Railway or Render by changing `DATABASE_URL` and the Prisma datasource provider
- JWT session cookie authentication with bcrypt password hashing
- Recharts analytics
- Tailwind CSS v4

## Features

- Email/password registration, login, logout, persistent sessions and protected routes
- Email verification, password reset email flow and Google OAuth authorization-code login
- User-owned resumes, profiles, applications, interviews, reminders and notes
- Job import endpoint using JSON-LD `JobPosting` first and HTML metadata fallback
- Manual review and edit workflow for all extracted job fields
- Duplicate prevention for the same user/job pair
- Dashboard summary cards, needs-action feed and upcoming interviews
- Application filters for status, company, role, location, package and closing date
- Application details with status change, resume/profile association, links, timeline, notes, interviews and reminders
- Resume management with upload/download/delete, local development storage and Supabase Storage support
- Profile management for role-specific application profiles
- Analytics for totals, conversion, statuses, companies, roles, resumes and monthly volume
- Development seed data
- Dockerfile and GitHub Actions CI

## Data Model

The Prisma schema defines:

- `User`
- `Company`
- `Job`
- `Application`
- `ApplicationEvent`
- `Interview`
- `Reminder`
- `Resume`
- `Profile`
- `Note`

`Job` and `Application` are intentionally separate. A job stores the external opportunity. An application belongs to one user and one job and tracks the user's lifecycle data.

## Environment Variables

Copy `.env.example` to `.env`.

```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="JobTrack <noreply@example.com>"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET=""
BROWSERLESS_TOKEN=""
BROWSERLESS_URL=""
```

When SMTP is not configured, verification and reset emails are printed to the dev server console. Google OAuth requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and this redirect URI in Google Cloud: `http://localhost:3000/api/auth/google/callback` for local development. Supabase Storage is used when all Supabase storage variables are present; otherwise files are stored under `UPLOAD_DIR`.

## Local Setup

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Seed login:

- Email: `demo@jobtrack.local`
- Password: `Password123`

## Development Commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run db:push
npm run db:seed
```

## Deployment

Use a hosted database and set `DATABASE_URL`. For PostgreSQL production, update the Prisma datasource provider from `sqlite` to `postgresql`, run a migration, and deploy to Vercel, Render or Railway. File storage is represented through resume metadata and local fallback paths; production should point `UPLOAD_DIR` or a provider-specific adapter to Supabase Storage, S3, R2 or another storage service.

## External Job Import Limitations

JobTrack cannot guarantee extraction from every job site. Some sites block automated requests, require login, or omit salary and closing dates. The import endpoint uses static HTML first, JSON-LD `JobPosting` where available, and an optional Browserless rendered-page fallback for client-rendered pages when `BROWSERLESS_TOKEN` or `BROWSERLESS_URL` is configured. It still returns partial extracted data and lets the user manually correct every important field before saving.
