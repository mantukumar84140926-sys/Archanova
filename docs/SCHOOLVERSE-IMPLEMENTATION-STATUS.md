# SCHOOLVERSE implementation and deployment notes

## Dedicated backend

- Supabase project: SCHOOLVERSE
- Project ref: `aemrcfitcndgmeabfdpn`
- Region: `ap-south-1` (Mumbai)
- Project status at last verification: `ACTIVE_HEALTHY`
- Project URL: `https://aemrcfitcndgmeabfdpn.supabase.co`
- Frontend publishable key is available in the branch's `.env.example`. It is designed to be public; never put a service-role key in browser code.

## Current database foundation

The project currently has 18 public application tables: schools, school_memberships, academic_years, classes, sections, students, staff, student_guardians, attendance, fee_invoices, fee_payments, audit_logs, school_applications, timetable_entries, homework, school_notices, exams and exam_results.

RLS is enabled on every table. The Supabase security and health advisors returned no findings after the initial policies were applied. Fee payment writes and audit-log access are intentionally server-only at this stage. Operational write policies are scoped to school roles; membership provisioning remains a trusted platform operation and is not exposed to public signup.

## Current web routes

- `/schoolverse`: public product landing page
- `/schoolverse/signup`: email/password account registration
- `/schoolverse/login`: email/password sign-in
- `/schoolverse/dashboard`: lists active school memberships for the signed-in user
- `/schoolverse/school/[slug]/[role]`: verified role workspace
- `/schoolverse/school/[slug]/[role]/students`: live student list and admission form for school admins/principals

A signup creates an authentication account only. It does not allow a person to create a school, choose a privileged role, or self-assign a school membership. A trusted school/platform administrator must provision the school and membership before the user can access school data.

## Required hosting configuration

Configure the following variables in the SCHOOLVERSE Vercel project (not in the AJEDUVERSE project):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the values in `.env.example`. The publishable key is safe for browser use when RLS is correctly enforced. Never add `SUPABASE_SERVICE_ROLE_KEY` to any `NEXT_PUBLIC_*` variable or client-side file.

## Supabase Auth URL configuration

After the SCHOOLVERSE web domain is assigned, configure Supabase Authentication URL settings:

- Site URL: the final SCHOOLVERSE domain.
- Redirect allowlist: the final domain's `/schoolverse/login?verified=1` callback and the local development callback `http://localhost:3000/schoolverse/login?verified=1`.
- Enable email/password authentication and configure SMTP/email confirmation according to the launch requirements.

Do not use the AJEDUVERSE callback domain unless it is intentionally assigned to SCHOOLVERSE.

## Deployment status and safety

The code is committed to `schoolverse-foundation`. The AJEDUVERSE `main` branch and existing production URL have not been changed by this work.

A separate Vercel project was not created: the connected Vercel account returned HTTP 403 (forbidden) for project creation. No deployment URL or successful build is claimed. Connect this repository/branch to a Vercel project with project-creation permission, set the environment variables above, and deploy the `schoolverse-foundation` branch. The route is served under `/schoolverse`.

## Remaining launch blockers

1. Create a trusted platform-owner provisioning path for schools and first school-admin memberships. Do not make this a public self-service role assignment.
2. Configure Supabase Auth redirect URLs and email delivery.
3. Connect a Vercel project and deploy the branch; then run a real build and smoke test.
4. Add assigned-class constraints for teachers, more granular student/parent data access, and automated cross-school authorization tests before production onboarding.
5. Complete the remaining modules (attendance UI, timetable, homework, notices, exams, payments/receipts, parent/student experiences) and jurisdiction-specific child-data privacy review.
