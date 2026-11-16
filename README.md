# AJEDUVERSE

**A Universe of Free Learning — Learn · Grow · Succeed**

AJEDUVERSE is a bilingual (Hindi + English) learning platform concept for school, college and competitive-exam students. The learner experience is designed to be simple, premium and mobile-friendly.

## Current website foundation

- Responsive public homepage with school, college and competitive-exam learning paths
- Search and category filters
- Dedicated workspace selector at `/portals`
- Three separate dashboard previews:
  - `/student` — student learning workspace
  - `/teacher` — teacher content and course workspace
  - `/admin` — platform administration workspace
- Shared responsive dashboard layout and navigation
- Hindi + English positioning and a 100% free-learning promise

## Important implementation status

The three role dashboards are currently **front-end previews**. The displayed metrics and example course data are sample content, not live database records. Authentication, role verification, Supabase database/storage, teacher approval, real course publishing, tests, notifications and AI doubt-solving still need to be implemented before production use.

Admin and teacher permissions must be enforced server-side and with Supabase Row Level Security; hiding links in the UI is not security.

## Planned architecture

- Next.js + React + TypeScript
- Supabase Auth, PostgreSQL and Storage
- Vercel hosting
- Role-based access for student, teacher and admin

## Run locally

Requirements: Node.js 20.9+

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Project rule

Keep AJEDUVERSE separate from other repositories and projects. The GitHub repository remains named `Archanova`.
