# AJEDUVERSE

**A Universe of Free Learning — Learn · Grow · Succeed**

AJEDUVERSE is a bilingual (Hindi + English) learning platform for school, college and competitive-exam students. The learner experience is designed to be simple, premium and mobile-friendly.

## Current website foundation

- Responsive public homepage with school, college and competitive-exam learning paths
- Search and category filters
- Email/password registration and login through Supabase Auth
- Email confirmation callback route
- Cookie-based Supabase SSR session refresh
- Server-side role checks for Student, Teacher and Admin dashboards
- Three separate dashboard previews:
  - `/student` — student learning workspace
  - `/teacher` — teacher workspace (approved teachers and admins only)
  - `/admin` — administration workspace (admins only)

## Supabase backend

Project: `AJEDUVERSE`  
Region: `ap-south-1` (Mumbai)  
Project ref: `myyekpxhkhphsifuhshb`

Initial database tables:

- `profiles` — account profile and protected role
- `teacher_applications` — teacher verification requests
- `courses`, `chapters`, `lessons`, `notes` — learning content
- `course_enrollments`, `student_progress` — learner enrolment and progress
- `announcements`, `notifications` — platform updates

Row Level Security is enabled on all public tables. New registrations are always assigned the Student role by a database trigger. User-editable signup metadata is never trusted for role assignment. Teacher course changes are limited to draft/review states; publication is reserved for admins.

## Local setup

Requirements: Node.js 20.9+

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`.
3. Add the AJEDUVERSE Supabase publishable key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The project URL is already shown in the example file.
4. Start the app:

   ```bash
   npm run dev
   ```

Open http://localhost:3000.

## Required deployment configuration

Set these environment variables in the hosting provider:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Only the publishable key belongs in browser-visible environment variables. Never add a Supabase secret/service-role key to the frontend, repository, or any `NEXT_PUBLIC_` variable.

In Supabase Auth settings, configure the production site URL and allowed redirect URLs, including `/auth/callback`.

## Important role setup

Every self-registered account starts as `student`. Do not add a role selector to public registration. The first platform Admin must be assigned manually by the project owner in the Supabase SQL editor after registering the owner's account and verifying its email. Teacher applications must be reviewed before their profile role is changed to `teacher`.

The dashboard cards still contain illustrative preview content; they are not yet live statistics. Test creation, question banks, AI doubt solving, storage buckets, real-time notifications and the complete admin review interface remain future implementation steps.

## Project rule

Keep AJEDUVERSE separate from other projects. The GitHub repository remains named `Archanova`.
