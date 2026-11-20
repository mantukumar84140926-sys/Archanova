# SCHOOLVERSE — Architecture & Build Plan

## Product direction
SCHOOLVERSE is a global-first, free-to-use, multi-tenant school management platform. It is designed for schools in different countries from day one. The first release is a responsive web application. A future Android application will reuse the same authentication, API contracts, and database.

The platform's school-access model is free. Infrastructure is not assumed to be unlimited: storage, email, messaging, database capacity, backups, and hosting must be monitored and budgeted. Do not introduce paid school tiers or mandatory upgrades unless the product owner explicitly changes this decision.

## Repository safety
This work is isolated on the `schoolverse-foundation` branch. Existing AJEDUVERSE routes, learning content, authentication flows, and production branch must remain untouched.

## Global product principles
- International onboarding: do not hard-code India, Bihar, INR, a single school calendar, or one address format.
- English is the initial default UI language; Hindi is an additional supported language. Build translation dictionaries so more locales can be added without rewriting screens.
- Store country as ISO 3166-1 alpha-2 and currency as ISO 4217 codes.
- Store each school's timezone as an IANA timezone identifier (for example, `Asia/Kolkata` or `Europe/London`).
- Store timestamps in UTC; render dates and times in the school's configured timezone and locale.
- Keep school calendar, academic year, term structure, grading scale, address format, and date display configurable per school/country.
- Monetary values must use integer minor units plus an ISO currency code; never use floating-point arithmetic for money. Do not assume all currencies have two decimal places.
- Country-aware privacy, child-data protection, retention, and data residency requirements must be reviewed before onboarding schools in each jurisdiction.
- Design for future regional hosting/data residency, but do not claim global data residency or legal compliance until implemented and verified.

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
- Never trust a school ID, role, or tenant slug supplied by the browser without checking trusted membership and authorization on the server/database.

## Core data domains
1. Platform: platform settings, schools, school settings, academic years, memberships.
2. People: user profiles, student profiles, parent profiles, teacher/staff profiles, verified guardian links.
3. Academics: classes, sections, subjects, class/subject assignments, timetables, terms and grading scales.
4. Operations: attendance, leave requests, homework, submissions, notices.
5. Finance: fee heads, fee plans, student invoices, payments, receipts; each monetary record includes currency.
6. Assessment: exams, exam subjects, marks, report cards.
7. Platform services: notifications, files metadata, audit events, consent/retention records where required.

## Initial web routes
- `/schoolverse`: public product landing page.
- `/schoolverse/login`: secure sign-in.
- `/schoolverse/platform`: platform owner dashboard.
- `/schoolverse/school/[schoolSlug]`: school workspace entry.
- `/schoolverse/school/[schoolSlug]/admin`: school administration.
- `/schoolverse/school/[schoolSlug]/principal`: principal workspace.
- `/schoolverse/school/[schoolSlug]/teacher`: teacher workspace.
- `/schoolverse/school/[schoolSlug]/student`: student workspace.
- `/schoolverse/school/[schoolSlug]/parent`: parent workspace.
- `/schoolverse/school/[schoolSlug]/accountant`: finance workspace.

## Delivery phases
1. Foundation: global-ready tenant schema, role/membership model, RLS, authentication and school onboarding.
2. School operations: students, guardians, teachers, classes, sections and academic years.
3. Daily workflow: attendance, timetable, homework and notices.
4. Finance: multi-currency fee plans, invoices, payments and printable receipts.
5. Assessment: configurable exams, grading scales, marks and report cards.
6. Parent/student experience: mobile-first portals, localization and notifications.
7. Hardening: audit review, cross-tenant security tests, backup/restore drills, privacy and deployment checks.
8. Android: Expo client consuming the same backend.

## Engineering decisions
- Keep the existing AJEDUVERSE app intact; SCHOOLVERSE work is isolated on this branch.
- Reuse the repository's Next.js + TypeScript foundation; connect a dedicated SCHOOLVERSE Supabase project only after its ownership and credentials are confirmed.
- Use server-side authorization for privileged actions and RLS as the database enforcement layer.
- Never trust a school ID sent by the browser without validating membership.
- Monetary values use integer minor units and an ISO currency code, with currency-specific decimal handling.
- Attendance has a uniqueness constraint per student, school, date and session.
- Fee payments and receipt generation must be transactional and idempotent.
- Store timestamps in UTC and display them in each school's configured timezone.
- Keep external integrations behind adapters so email, SMS, payment gateways and identity providers can vary by region.

## Definition of done for the foundation
- School onboarding creates a school and its first admin membership atomically.
- A user cannot read or mutate another school's records by changing URL or request parameters.
- Public signup cannot self-assign privileged roles.
- Student and parent access is limited to their own records and verified relationships.
- Country, locale, currency and timezone can be configured per school.
- Core routes render responsively on mobile and desktop.
- Automated tests cover tenant isolation and role boundaries before production launch.
