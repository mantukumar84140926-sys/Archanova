# SCHOOLVERSE — Global-First Foundation Specification

## Product decision
- Product: SCHOOLVERSE
- Positioning: global-first school management platform
- School access: free; no paid school plans or mandatory upgrades for the current product decision
- First client: responsive website
- Later client: Android app using the same backend
- Company identity: undecided; keep company/legal branding configurable and do not hard-code an owner name

## Tenant model
Use a shared PostgreSQL database with strict row-level tenant isolation for the initial stage. Every tenant-owned record must carry `school_id`. A user can belong to multiple schools through `school_memberships`. The active school context is resolved from a verified membership, never trusted from a client-provided school ID alone.

Platform-level records (such as global configuration and platform operators) are separate from school-owned records. Platform-owner access is explicitly provisioned and audited; it is not available through public signup.

## Global configuration model
Each school has:
- `country_code`: ISO 3166-1 alpha-2
- `default_locale`: BCP 47 locale tag (for example `en-US`, `en-GB`, `hi-IN`)
- `timezone`: IANA timezone (for example `Asia/Kolkata`)
- `currency_code`: ISO 4217 code
- `date_format`: configurable display preference
- `academic_calendar_config`: flexible start/end dates and term structure
- `address_config`: country-aware address fields
- `grading_config`: configurable grading scale and pass rules

Do not assume all currencies have two decimal places. Monetary records store integer minor units and the currency code. Timestamps are stored in UTC; local display uses the school's configured timezone.

## Initial relational domains
- `schools`, `school_settings`, `academic_years`
- `profiles`, `school_memberships`, `parent_student_links`
- `students`, `parents`, `teachers`, `staff`
- `classes`, `sections`, `subjects`, `class_subject_assignments`, `timetables`
- `attendance`, `leave_requests`, `homework`, `homework_submissions`, `notices`
- `fee_heads`, `fee_plans`, `invoices`, `payments`, `receipts`
- `exams`, `exam_subjects`, `marks`, `report_cards`
- `audit_events`, `file_metadata`, `notification_jobs`

All school-owned tables must have RLS enabled. Policies must validate trusted membership and role. Parent-child access must use verified relationship rows. Views exposed to client roles must be reviewed for RLS behavior. Service credentials remain server-only.

## Application boundaries
- Public marketing pages do not require authentication.
- Authenticated routes resolve the user and their verified school membership on the server.
- Business operations with multi-row effects (school onboarding, admissions, fee payment/receipt, attendance batch submission) run transactionally on the server/database.
- Payment operations use idempotency keys.
- External services (email, SMS, payment providers, analytics) are accessed through adapters so country-specific providers can be added without rewriting core modules.
- Android and web clients share the same authorization rules and backend contracts.

## Internationalization and compliance
English is the initial default language; Hindi is an initial additional locale. Translation keys must be externalized from UI components. Country-specific privacy, child-data, retention, consent, and data-residency requirements must be assessed before launch in each jurisdiction. Do not market the platform as compliant with a jurisdiction until legal and technical review is complete.

## Operational safeguards
- Separate development, preview and production environments.
- Dedicated SCHOOLVERSE Supabase project; do not reuse AJEDUVERSE production data or secrets.
- Backups and restore drills, audit logs, error monitoring, rate limiting and abuse controls.
- Monitor database, storage, email and hosting quotas because school access is free but infrastructure has real limits.
- Pilot with a small number of schools before broad public onboarding.

## Phase 1 acceptance criteria
1. Dedicated backend environment exists and is not shared with AJEDUVERSE.
2. Schema and migrations are version-controlled.
3. School onboarding creates school + first admin membership atomically.
4. Roles are assigned only by trusted server-side flows.
5. RLS tests prove cross-school reads and writes are denied.
6. A school can configure country, locale, timezone and currency.
7. Signup/login, logout, session refresh and unauthorized redirects are tested.
