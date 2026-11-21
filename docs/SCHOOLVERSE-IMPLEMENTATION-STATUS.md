# SCHOOLVERSE implementation and release status

## Product and infrastructure

- Parent brand: RITEX
- Product: SCHOOLVERSE
- Supabase project: `aemrcfitcndgmeabfdpn`
- Region: `ap-south-1` (Mumbai), Free plan
- Project URL: `https://aemrcfitcndgmeabfdpn.supabase.co`
- Frontend publishable key is configured in `.env.example`; it is safe for browser use with RLS.
- Work is isolated on `schoolverse-foundation`. AJEDUVERSE `main` and its production deployment are not modified.

## Android and web access

- The SCHOOLVERSE web app is responsive and includes an installable PWA manifest and app icon for Android home-screen installation. This is not a Play Store APK; a native Android package remains a separate release deliverable.

## Database foundation

19 public application tables are present:
`schools`, `school_memberships`, `academic_years`, `classes`, `sections`, `students`, `staff`, `student_guardians`, `attendance`, `fee_invoices`, `fee_payments`, `audit_logs`, `school_applications`, `timetable_entries`, `homework`, `school_notices`, `exams`, `exam_results`, and `teaching_assignments`.

RLS is enabled on all application tables. Anonymous (`anon`) access to all current and future public-schema tables and sequences is revoked; signed-in users retain the grants needed for RLS-scoped access. Membership provisioning, payment recording, platform application review, guardian verification and account linking are server-only operations. Public signup cannot assign school membership or privileged roles. One user may hold multiple independently authorised roles in the same school (for example, teacher and parent). School provisioning RPC execution is restricted to `service_role`. Teacher access to students, attendance and homework is restricted to linked teaching assignments. Timetable database exclusion constraints prevent class/teacher time overlaps. Fee payment recording is transactional, idempotent, prevents overpayment, updates invoice status and creates a receipt number plus audit event. Student, staff and guardian account linking is atomic and audited. Platform application approval/rejection and guardian verification are also transactional and audited. Student, staff and guardian account linking now also runs through service-role-only database transactions, with membership and profile changes committed together and audit events written atomically.

## Implemented routes

- `/schoolverse`: product landing page
- `/schoolverse/signup`, `/schoolverse/login`: email/password authentication
- `/schoolverse/forgot-password`, `/schoolverse/reset-password`: secure email-based password recovery
- `/schoolverse/dashboard`: school memberships and application status
- `/schoolverse/apply`: authenticated school onboarding application
- `/schoolverse/platform`: private RITEX application review and school provisioning UI
- `/api/schoolverse/provision`: allowlisted platform-admin API; creates school and first school-admin membership
- `/schoolverse/school/[slug]/[role]`: role-aware school workspace
- `/schoolverse/school/[slug]/[role]/settings`: school profile, country, currency, locale and timezone configuration
- `/schoolverse/school/[slug]/[role]/students`: student records and admission with class, section, DOB and contact fields
- `/schoolverse/school/[slug]/[role]/students/accounts`: student login invitations and account linking
- `/api/schoolverse/students/link-account`: server-side student account invitation and atomic account linking
- `/schoolverse/school/[slug]/[role]/students/guardians`: guardian invitations and school-admin relationship verification
- `/api/schoolverse/students/guardians`: server-side guardian invitation and verification API; account membership and guardian relationship are created atomically
- `/schoolverse/school/[slug]/[role]/staff`: staff directory, invitations and teaching assignments
- `/api/schoolverse/staff/link-account`: verified administrator-only staff invitation and atomic account linking
- `/schoolverse/school/[slug]/[role]/attendance`: attendance marking and review
- `/schoolverse/school/[slug]/[role]/academics`: academic years, current-year selection, classes and sections
- `/schoolverse/school/[slug]/[role]/timetable`: weekly periods, teachers, sections and database conflict protection
- `/schoolverse/school/[slug]/[role]/homework`: class assignments with teacher assignment permissions
- `/schoolverse/school/[slug]/[role]/notices`: audience-filtered school notices
- `/schoolverse/school/[slug]/[role]/fees`: invoices, manual payment recording and receipt list
- `/schoolverse/school/[slug]/[role]/fees/receipt/[id]`: printable receipt / save as PDF
- `/api/schoolverse/fees/payments`: authenticated server-side payment recording
- `/schoolverse/school/[slug]/[role]/exams`: exam sessions, marks and published results

## Server environment required before end-to-end use

Set these only in the separate SCHOOLVERSE hosting environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server-only; never expose to browser code)
- `RITEX_PLATFORM_ADMIN_EMAILS` (comma-separated verified platform administrator email allowlist)

Configure Supabase Auth Site URL, redirect allowlist and email delivery after the SCHOOLVERSE domain is selected. Staff invitations use Supabase Auth email delivery. Payment recording currently records payments already received by the school (cash/UPI/bank/card/cheque); no third-party payment gateway is connected.

## Release blockers / external dependencies

1. The hosting account previously returned HTTP 403 when creating a separate Vercel project. Deployment is intentionally deferred; do not use the AJEDUVERSE Vercel project.
2. The verified RITEX platform-admin email allowlist and server-only Supabase secret key must be entered in the SCHOOLVERSE hosting environment before platform provisioning, staff invitations and server-side payment recording can run.
3. Supabase Auth redirect URLs and production email delivery need final domain configuration.
4. Full end-to-end role tests require test accounts for each role (school admin, principal, teacher, accountant, student and verified parent/guardian).
5. A real payment gateway requires the school's merchant account, provider credentials, webhook signing secret and reconciliation rules. The current manual receipt workflow must not be represented as online payment processing.
6. Production launch still requires cross-school authorization tests, child-data privacy/legal review for each target country, backup/restore rehearsal, monitoring, rate limits and operational support procedures.

## Verification

- Verified that `anon` has no table privileges on public application tables; `has_table_privilege` returned false for student reads and fee-payment writes. `authenticated` retains required table privileges, with row access controlled by RLS.
- Supabase Security Advisor and Health Advisor returned no findings after the anonymous-access hardening.
- Performance Advisor may report unused-index INFO findings while the new tables have little or no production data.
- GitHub Actions is configured to run `npm install`, `npm run lint` and `npm run build`; verify the latest branch-head run before release.
