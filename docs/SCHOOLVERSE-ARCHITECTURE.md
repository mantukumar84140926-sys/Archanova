# SCHOOLVERSE — Architecture & Build Plan

## Product direction
SCHOOLVERSE is a multi-tenant school management platform. The first release is a responsive web application. A future Android application will reuse the same authentication, API contracts, and database.

## Repository safety
This work is isolated on the `schoolverse-foundation` branch. Existing AJEDUVERSE routes, learning content, authentication flows, and production branch are not modified by this foundation document.

## Roles
- `platform_owner`: manages the platform and school onboarding.
- `school_admin`: manages one school and its configuration.
- `principal`: school-wide oversight and approvals.
- `teacher`: assigned classes, attendance, homework, marks.
- `student`: own timetable, homework, attendance, results.
- `parent`: linked children only; attendance, fees, notices, progress.
- `accountant`: fee plans, collections, receipts, dues and reports.

A user may have memberships in more than one school. Authorization is based on trusted database membership records, never user-editable signup metadata.

## Multi-tenant security model
- Every school-owned record carries a non-null `school_id`.
- Membership records map `auth.users.id` to a school and a school role.
- Parent-child links are explicit and verified by school staff.
- Row Level Security is enabled on every exposed school table.
- Policies check both the authenticated user and active school membership.
- Platform-owner privileges are granted explicitly, not through public signup.
- Service-role secrets stay server-side and are never exposed to browser code.
- Sensitive changes are written to an audit log.
- Cross-school access tests are required before launch.

## Core data domains
1. Platform: schools, school settings, academic years, memberships.
2. People: student profiles, parent profiles, teacher/staff profiles, guardian links.
3. Academics: classes, sections, subjects, class/subject assignments, timetables.
4. Operations: attendance, leave requests, homework, submissions, notices.
5. Finance: fee heads, fee plans, student invoices, payments, receipts.
6. Assessment: exams, exam subjects, marks, report cards.
7. Platform services: notifications, files metadata, audit events.

## Initial web routes
- `/`: public product landing page.
- `/login`: secure sign-in.
- `/platform`: platform owner dashboard.
- `/school/[schoolSlug]`: school workspace entry.
- `/school/[schoolSlug]/admin`: school administration.
- `/school/[schoolSlug]/principal`: principal workspace.
- `/school/[schoolSlug]/teacher`: teacher workspace.
- `/school/[schoolSlug]/student`: student workspace.
- `/school/[schoolSlug]/parent`: parent workspace.
- `/school/[schoolSlug]/accountant`: finance workspace.

## Delivery phases
1. Foundation: tenant schema, role/membership model, RLS, authentication and school onboarding.
2. School operations: students, guardians, teachers, classes, sections and academic years.
3. Daily workflow: attendance, timetable, homework and notices.
4. Finance: fee plans, invoices, payments and printable receipts.
5. Assessment: exams, marks and report cards.
6. Parent/student experience: mobile-first portals and notifications.
7. Hardening: audit review, cross-tenant security tests, backups and deployment checks.
8. Android: Expo client consuming the same backend.

## Engineering decisions
- Keep the existing AJEDUVERSE app intact; SCHOOLVERSE work is isolated on this branch.
- Reuse the repository's Next.js + TypeScript + Supabase foundation only after verifying existing auth integration.
- Use server-side authorization for privileged actions and RLS as the database enforcement layer.
- Never trust a school ID sent by the browser without validating membership.
- Financial records use integer paise (INR minor units) to avoid floating-point errors.
- Attendance has a uniqueness constraint per student, school, and attendance date/session.
- Fee payments and receipt generation must be transactional and idempotent.
- All dates are stored consistently and displayed in the school's configured timezone.

## Definition of done for the foundation
- School onboarding creates a school and its first admin membership atomically.
- A user cannot read or mutate another school's records by changing URL or request parameters.
- Public signup cannot self-assign privileged roles.
- Student and parent access is limited to their own records and verified relationships.
- Core routes render responsively on mobile and desktop.
