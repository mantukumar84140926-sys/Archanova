-- Reproducible SCHOOLVERSE schema snapshot generated from the verified live database.
SET search_path = public, extensions;
create extension if not exists btree_gist with schema extensions;
create type public.invoice_status as enum ('draft', 'issued', 'part_paid', 'paid', 'void');

create type public.payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

create type public.school_member_role as enum ('school_admin', 'principal', 'teacher', 'student', 'parent', 'accountant');

create type public.school_record_status as enum ('active', 'inactive', 'suspended');

create type public.student_attendance_status as enum ('present', 'absent', 'late', 'excused');

create table public.schools (  id uuid default gen_random_uuid() not null,
  name text not null,
  slug text not null,
  country_code character(2) not null,
  default_locale text default 'en'::text not null,
  currency_code character(3) not null,
  timezone text not null,
  status text default 'active'::text not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null);

create table public.school_memberships (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  user_id uuid not null,
  role school_member_role not null,
  status school_record_status default 'active'::school_record_status not null,
  created_at timestamp with time zone default now() not null);

create table public.academic_years (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  is_current boolean default false not null,
  created_at timestamp with time zone default now() not null);

create table public.classes (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  name text not null,
  level integer,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null);

create table public.sections (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  class_id uuid not null,
  name text not null,
  created_at timestamp with time zone default now() not null);

create table public.students (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  class_id uuid,
  section_id uuid,
  auth_user_id uuid,
  admission_number text not null,
  first_name text not null,
  last_name text,
  date_of_birth date,
  admission_date date default CURRENT_DATE not null,
  email text,
  phone text,
  status school_record_status default 'active'::school_record_status not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null);

create table public.staff (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  auth_user_id uuid,
  employee_number text not null,
  first_name text not null,
  last_name text,
  designation text,
  email text,
  phone text,
  status school_record_status default 'active'::school_record_status not null,
  created_at timestamp with time zone default now() not null,
  portal_role text default 'teacher'::text not null);

create table public.student_guardians (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  student_id uuid not null,
  guardian_user_id uuid not null,
  relationship text not null,
  is_primary boolean default false not null,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone default now() not null,
  guardian_email text);

create table public.attendance (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  student_id uuid not null,
  attendance_date date not null,
  session_key text default 'full_day'::text not null,
  status student_attendance_status not null,
  note text,
  marked_by uuid,
  created_at timestamp with time zone default now() not null);

create table public.fee_invoices (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  student_id uuid not null,
  academic_year_id uuid,
  invoice_number text not null,
  currency_code character(3) not null,
  total_minor bigint not null,
  due_date date,
  status invoice_status default 'draft'::invoice_status not null,
  created_at timestamp with time zone default now() not null);

create table public.fee_payments (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  invoice_id uuid not null,
  amount_minor bigint not null,
  currency_code character(3) not null,
  status payment_status default 'pending'::payment_status not null,
  provider text,
  provider_reference text,
  idempotency_key text not null,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  receipt_number text not null,
  payment_method text default 'other'::text not null,
  received_by uuid,
  notes text);

create table public.audit_logs (  id bigint generated always as identity not null,
  school_id uuid,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null);

create table public.school_applications (  id uuid default gen_random_uuid() not null,
  applicant_user_id uuid not null,
  school_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  country_code character(2) not null,
  city text not null,
  expected_students integer,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null);

create table public.timetable_entries (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  class_id uuid not null,
  section_id uuid,
  subject text not null,
  teacher_id uuid,
  day_of_week smallint not null,
  starts_at time without time zone not null,
  ends_at time without time zone not null,
  room text,
  created_at timestamp with time zone default now() not null);

create table public.homework (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  class_id uuid not null,
  section_id uuid,
  title text not null,
  instructions text not null,
  subject text not null,
  due_date date,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null);

create table public.school_notices (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  title text not null,
  body text not null,
  audience text default 'all'::text not null,
  published_at timestamp with time zone,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null);

create table public.exams (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  academic_year_id uuid,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text default 'draft'::text not null,
  created_at timestamp with time zone default now() not null);

create table public.exam_results (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  exam_id uuid not null,
  student_id uuid not null,
  subject text not null,
  max_marks numeric(9,2) not null,
  marks_obtained numeric(9,2) not null,
  grade text,
  remarks text,
  created_at timestamp with time zone default now() not null);

create table public.teaching_assignments (  id uuid default gen_random_uuid() not null,
  school_id uuid not null,
  staff_id uuid not null,
  class_id uuid not null,
  section_id uuid,
  assigned_by uuid not null,
  created_at timestamp with time zone default now() not null);

alter table public.academic_years add constraint academic_years_check CHECK ((ends_on >= starts_on));
alter table public.academic_years add constraint academic_years_id_school_id_key UNIQUE (id, school_id);
alter table public.academic_years add constraint academic_years_pkey PRIMARY KEY (id);
alter table public.academic_years add constraint academic_years_school_id_name_key UNIQUE (school_id, name);
alter table public.attendance add constraint attendance_pkey PRIMARY KEY (id);
alter table public.attendance add constraint attendance_student_id_attendance_date_session_key_key UNIQUE (student_id, attendance_date, session_key);
alter table public.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id);
alter table public.classes add constraint classes_id_school_id_key UNIQUE (id, school_id);
alter table public.classes add constraint classes_pkey PRIMARY KEY (id);
alter table public.classes add constraint classes_school_id_name_key UNIQUE (school_id, name);
alter table public.exam_results add constraint exam_results_check CHECK (((marks_obtained >= (0)::numeric) AND (marks_obtained <= max_marks)));
alter table public.exam_results add constraint exam_results_max_marks_check CHECK ((max_marks > (0)::numeric));
alter table public.exam_results add constraint exam_results_pkey PRIMARY KEY (id);
alter table public.exam_results add constraint exam_results_subject_check CHECK (((char_length(btrim(subject)) >= 1) AND (char_length(btrim(subject)) <= 100)));
alter table public.exam_results add constraint exam_results_unique_subject UNIQUE (exam_id, student_id, subject);
alter table public.exams add constraint exams_date_order CHECK ((ends_on >= starts_on));
alter table public.exams add constraint exams_id_school_unique UNIQUE (id, school_id);
alter table public.exams add constraint exams_name_check CHECK (((char_length(btrim(name)) >= 2) AND (char_length(btrim(name)) <= 160)));
alter table public.exams add constraint exams_pkey PRIMARY KEY (id);
alter table public.exams add constraint exams_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
alter table public.fee_invoices add constraint fee_invoices_currency_code_check CHECK ((currency_code ~ '^[A-Z]{3}$'::text));
alter table public.fee_invoices add constraint fee_invoices_id_school_id_key UNIQUE (id, school_id);
alter table public.fee_invoices add constraint fee_invoices_pkey PRIMARY KEY (id);
alter table public.fee_invoices add constraint fee_invoices_school_id_invoice_number_key UNIQUE (school_id, invoice_number);
alter table public.fee_invoices add constraint fee_invoices_total_minor_check CHECK ((total_minor >= 0));
alter table public.fee_payments add constraint fee_payments_amount_minor_check CHECK ((amount_minor > 0));
alter table public.fee_payments add constraint fee_payments_currency_code_check CHECK ((currency_code ~ '^[A-Z]{3}$'::text));
alter table public.fee_payments add constraint fee_payments_payment_method_check CHECK ((payment_method = ANY (ARRAY['cash'::text, 'upi'::text, 'bank_transfer'::text, 'card'::text, 'cheque'::text, 'other'::text])));
alter table public.fee_payments add constraint fee_payments_pkey PRIMARY KEY (id);
alter table public.fee_payments add constraint fee_payments_school_id_idempotency_key_key UNIQUE (school_id, idempotency_key);
alter table public.homework add constraint homework_instructions_check CHECK (((char_length(btrim(instructions)) >= 1) AND (char_length(btrim(instructions)) <= 10000)));
alter table public.homework add constraint homework_pkey PRIMARY KEY (id);
alter table public.homework add constraint homework_subject_check CHECK (((char_length(btrim(subject)) >= 1) AND (char_length(btrim(subject)) <= 100)));
alter table public.homework add constraint homework_title_check CHECK (((char_length(btrim(title)) >= 2) AND (char_length(btrim(title)) <= 180)));
alter table public.school_applications add constraint school_applications_city_check CHECK (((char_length(btrim(city)) >= 2) AND (char_length(btrim(city)) <= 100)));
alter table public.school_applications add constraint school_applications_contact_email_check CHECK (((char_length(btrim(contact_email)) >= 5) AND (char_length(btrim(contact_email)) <= 254)));
alter table public.school_applications add constraint school_applications_contact_name_check CHECK (((char_length(btrim(contact_name)) >= 2) AND (char_length(btrim(contact_name)) <= 120)));
alter table public.school_applications add constraint school_applications_country_code_check CHECK ((country_code ~ '^[A-Z]{2}$'::text));
alter table public.school_applications add constraint school_applications_expected_students_check CHECK (((expected_students IS NULL) OR ((expected_students >= 1) AND (expected_students <= 100000))));
alter table public.school_applications add constraint school_applications_pkey PRIMARY KEY (id);
alter table public.school_applications add constraint school_applications_school_name_check CHECK (((char_length(btrim(school_name)) >= 2) AND (char_length(btrim(school_name)) <= 180)));
alter table public.school_applications add constraint school_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'rejected'::text])));
alter table public.school_memberships add constraint school_memberships_id_school_id_key UNIQUE (id, school_id);
alter table public.school_memberships add constraint school_memberships_pkey PRIMARY KEY (id);
alter table public.school_memberships add constraint school_memberships_school_user_role_unique UNIQUE (school_id, user_id, role);
alter table public.school_notices add constraint school_notices_audience_check CHECK ((audience = ANY (ARRAY['all'::text, 'staff'::text, 'students'::text, 'parents'::text])));
alter table public.school_notices add constraint school_notices_body_check CHECK (((char_length(btrim(body)) >= 1) AND (char_length(btrim(body)) <= 12000)));
alter table public.school_notices add constraint school_notices_pkey PRIMARY KEY (id);
alter table public.school_notices add constraint school_notices_title_check CHECK (((char_length(btrim(title)) >= 2) AND (char_length(btrim(title)) <= 180)));
alter table public.schools add constraint schools_country_code_check CHECK ((country_code ~ '^[A-Z]{2}$'::text));
alter table public.schools add constraint schools_currency_code_check CHECK ((currency_code ~ '^[A-Z]{3}$'::text));
alter table public.schools add constraint schools_default_locale_check CHECK (((length(default_locale) >= 2) AND (length(default_locale) <= 35)));
alter table public.schools add constraint schools_name_check CHECK (((length(TRIM(BOTH FROM name)) >= 2) AND (length(TRIM(BOTH FROM name)) <= 180)));
alter table public.schools add constraint schools_pkey PRIMARY KEY (id);
alter table public.schools add constraint schools_slug_check CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text));
alter table public.schools add constraint schools_slug_key UNIQUE (slug);
alter table public.schools add constraint schools_status_check CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'closed'::text])));
alter table public.sections add constraint sections_class_id_name_key UNIQUE (class_id, name);
alter table public.sections add constraint sections_id_school_class_unique UNIQUE (id, school_id, class_id);
alter table public.sections add constraint sections_id_school_id_key UNIQUE (id, school_id);
alter table public.sections add constraint sections_pkey PRIMARY KEY (id);
alter table public.staff add constraint staff_id_school_id_key UNIQUE (id, school_id);
alter table public.staff add constraint staff_pkey PRIMARY KEY (id);
alter table public.staff add constraint staff_portal_role_check CHECK ((portal_role = ANY (ARRAY['teacher'::text, 'accountant'::text, 'principal'::text, 'support'::text])));
alter table public.staff add constraint staff_school_id_employee_number_key UNIQUE (school_id, employee_number);
alter table public.student_guardians add constraint student_guardians_pkey PRIMARY KEY (id);
alter table public.student_guardians add constraint student_guardians_student_id_guardian_user_id_key UNIQUE (student_id, guardian_user_id);
alter table public.students add constraint students_id_school_id_key UNIQUE (id, school_id);
alter table public.students add constraint students_pkey PRIMARY KEY (id);
alter table public.students add constraint students_school_id_admission_number_key UNIQUE (school_id, admission_number);
alter table public.teaching_assignments add constraint teaching_assignments_pkey PRIMARY KEY (id);
alter table public.timetable_entries add constraint timetable_entries_day_of_week_check CHECK (((day_of_week >= 1) AND (day_of_week <= 7)));
alter table public.timetable_entries add constraint timetable_entries_pkey PRIMARY KEY (id);
alter table public.timetable_entries add constraint timetable_entries_subject_check CHECK (((char_length(btrim(subject)) >= 1) AND (char_length(btrim(subject)) <= 100)));
alter table public.timetable_entries add constraint timetable_no_class_overlap EXCLUDE USING gist (school_id WITH =, class_id WITH =, day_of_week WITH =, int4range(((EXTRACT(epoch FROM starts_at) / (60)::numeric))::integer, ((EXTRACT(epoch FROM ends_at) / (60)::numeric))::integer, '[)'::text) WITH &&);
alter table public.timetable_entries add constraint timetable_no_teacher_overlap EXCLUDE USING gist (school_id WITH =, teacher_id WITH =, day_of_week WITH =, int4range(((EXTRACT(epoch FROM starts_at) / (60)::numeric))::integer, ((EXTRACT(epoch FROM ends_at) / (60)::numeric))::integer, '[)'::text) WITH &&) WHERE ((teacher_id IS NOT NULL));
alter table public.timetable_entries add constraint timetable_time_order CHECK ((ends_at > starts_at));
alter table public.academic_years add constraint academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.attendance add constraint attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.attendance add constraint attendance_student_id_school_id_fkey FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id) ON DELETE CASCADE;
alter table public.audit_logs add constraint audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.audit_logs add constraint audit_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;
alter table public.classes add constraint classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.exam_results add constraint exam_results_exam_school_fk FOREIGN KEY (exam_id, school_id) REFERENCES exams(id, school_id) ON DELETE CASCADE;
alter table public.exam_results add constraint exam_results_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.exam_results add constraint exam_results_student_school_fk FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id) ON DELETE CASCADE;
alter table public.exams add constraint exams_academic_year_school_fk FOREIGN KEY (academic_year_id, school_id) REFERENCES academic_years(id, school_id);
alter table public.exams add constraint exams_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.fee_invoices add constraint fee_invoices_academic_year_id_school_id_fkey FOREIGN KEY (academic_year_id, school_id) REFERENCES academic_years(id, school_id);
alter table public.fee_invoices add constraint fee_invoices_student_id_school_id_fkey FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id);
alter table public.fee_payments add constraint fee_payments_invoice_id_school_id_fkey FOREIGN KEY (invoice_id, school_id) REFERENCES fee_invoices(id, school_id);
alter table public.fee_payments add constraint fee_payments_received_by_fkey FOREIGN KEY (received_by) REFERENCES auth.users(id);
alter table public.homework add constraint homework_class_school_fk FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE;
alter table public.homework add constraint homework_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.homework add constraint homework_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.homework add constraint homework_section_school_fk FOREIGN KEY (section_id, school_id) REFERENCES sections(id, school_id) ON DELETE CASCADE;
alter table public.school_applications add constraint school_applications_applicant_user_id_fkey FOREIGN KEY (applicant_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.school_memberships add constraint school_memberships_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.school_memberships add constraint school_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.school_notices add constraint school_notices_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.school_notices add constraint school_notices_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.schools add constraint schools_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.sections add constraint sections_class_id_school_id_fkey FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE;
alter table public.staff add constraint staff_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.staff add constraint staff_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.student_guardians add constraint student_guardians_guardian_user_id_fkey FOREIGN KEY (guardian_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.student_guardians add constraint student_guardians_student_id_school_id_fkey FOREIGN KEY (student_id, school_id) REFERENCES students(id, school_id) ON DELETE CASCADE;
alter table public.student_guardians add constraint student_guardians_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.students add constraint students_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.students add constraint students_class_id_school_id_fkey FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id);
alter table public.students add constraint students_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.students add constraint students_section_id_school_id_fkey FOREIGN KEY (section_id, school_id) REFERENCES sections(id, school_id);
alter table public.teaching_assignments add constraint teaching_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);
alter table public.teaching_assignments add constraint teaching_assignments_class_school_fk FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE;
alter table public.teaching_assignments add constraint teaching_assignments_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.teaching_assignments add constraint teaching_assignments_section_class_fk FOREIGN KEY (section_id, school_id, class_id) REFERENCES sections(id, school_id, class_id) ON DELETE CASCADE;
alter table public.teaching_assignments add constraint teaching_assignments_section_school_fk FOREIGN KEY (section_id, school_id) REFERENCES sections(id, school_id) ON DELETE CASCADE;
alter table public.teaching_assignments add constraint teaching_assignments_staff_school_fk FOREIGN KEY (staff_id, school_id) REFERENCES staff(id, school_id) ON DELETE CASCADE;
alter table public.timetable_entries add constraint timetable_class_school_fk FOREIGN KEY (class_id, school_id) REFERENCES classes(id, school_id) ON DELETE CASCADE;
alter table public.timetable_entries add constraint timetable_entries_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
alter table public.timetable_entries add constraint timetable_section_class_school_fk FOREIGN KEY (section_id, school_id, class_id) REFERENCES sections(id, school_id, class_id) ON DELETE CASCADE;
alter table public.timetable_entries add constraint timetable_section_school_fk FOREIGN KEY (section_id, school_id) REFERENCES sections(id, school_id) ON DELETE CASCADE;
alter table public.timetable_entries add constraint timetable_teacher_school_fk FOREIGN KEY (teacher_id, school_id) REFERENCES staff(id, school_id) ON DELETE RESTRICT;

CREATE INDEX attendance_marked_by_idx ON public.attendance USING btree (marked_by);
CREATE INDEX attendance_school_date_idx ON public.attendance USING btree (school_id, attendance_date);
CREATE INDEX attendance_student_school_idx ON public.attendance USING btree (student_id, school_id);
CREATE INDEX audit_logs_actor_user_idx ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX audit_logs_school_created_idx ON public.audit_logs USING btree (school_id, created_at DESC);
CREATE INDEX exam_results_exam_school_idx ON public.exam_results USING btree (exam_id, school_id);
CREATE INDEX exam_results_school_exam_idx ON public.exam_results USING btree (school_id, exam_id);
CREATE INDEX exam_results_student_exam_idx ON public.exam_results USING btree (student_id, exam_id);
CREATE INDEX exam_results_student_school_idx ON public.exam_results USING btree (student_id, school_id);
CREATE INDEX exams_academic_year_school_idx ON public.exams USING btree (academic_year_id, school_id);
CREATE INDEX exams_school_dates_idx ON public.exams USING btree (school_id, starts_on DESC);
CREATE INDEX fee_invoices_academic_year_school_idx ON public.fee_invoices USING btree (academic_year_id, school_id);
CREATE INDEX fee_invoices_student_idx ON public.fee_invoices USING btree (school_id, student_id);
CREATE INDEX fee_invoices_student_school_idx ON public.fee_invoices USING btree (student_id, school_id);
CREATE INDEX fee_payments_invoice_school_idx ON public.fee_payments USING btree (invoice_id, school_id);
CREATE INDEX fee_payments_invoice_status_idx ON public.fee_payments USING btree (invoice_id, status, paid_at DESC);
CREATE UNIQUE INDEX fee_payments_provider_ref_unique ON public.fee_payments USING btree (school_id, provider, provider_reference) WHERE ((provider IS NOT NULL) AND (provider_reference IS NOT NULL));
CREATE INDEX fee_payments_received_by_idx ON public.fee_payments USING btree (received_by);
CREATE UNIQUE INDEX fee_payments_school_receipt_unique ON public.fee_payments USING btree (school_id, receipt_number);
CREATE INDEX homework_class_school_idx ON public.homework USING btree (class_id, school_id);
CREATE INDEX homework_created_by_idx ON public.homework USING btree (created_by);
CREATE INDEX homework_school_due_idx ON public.homework USING btree (school_id, due_date DESC);
CREATE INDEX homework_section_school_idx ON public.homework USING btree (section_id, school_id);
CREATE INDEX school_applications_applicant_created_idx ON public.school_applications USING btree (applicant_user_id, created_at DESC);
CREATE INDEX school_memberships_user_id_idx ON public.school_memberships USING btree (user_id);
CREATE INDEX school_notices_created_by_idx ON public.school_notices USING btree (created_by);
CREATE INDEX school_notices_school_published_idx ON public.school_notices USING btree (school_id, published_at DESC);
CREATE INDEX schools_created_by_idx ON public.schools USING btree (created_by);
CREATE INDEX sections_class_school_idx ON public.sections USING btree (class_id, school_id);
CREATE INDEX staff_auth_user_id_idx ON public.staff USING btree (auth_user_id);
CREATE UNIQUE INDEX staff_school_auth_user_unique ON public.staff USING btree (school_id, auth_user_id) WHERE (auth_user_id IS NOT NULL);
CREATE INDEX student_guardians_guardian_idx ON public.student_guardians USING btree (guardian_user_id, school_id);
CREATE UNIQUE INDEX student_guardians_one_primary_per_student ON public.student_guardians USING btree (student_id) WHERE is_primary;
CREATE INDEX student_guardians_student_school_idx ON public.student_guardians USING btree (student_id, school_id);
CREATE INDEX student_guardians_verified_by_idx ON public.student_guardians USING btree (verified_by);
CREATE INDEX students_auth_user_idx ON public.students USING btree (auth_user_id) WHERE (auth_user_id IS NOT NULL);
CREATE INDEX students_class_school_idx ON public.students USING btree (class_id, school_id);
CREATE INDEX students_school_class_idx ON public.students USING btree (school_id, class_id, section_id);
CREATE INDEX students_section_school_idx ON public.students USING btree (section_id, school_id);
CREATE INDEX teaching_assignments_assigned_by_idx ON public.teaching_assignments USING btree (assigned_by);
CREATE INDEX teaching_assignments_class_school_fk_idx ON public.teaching_assignments USING btree (class_id, school_id);
CREATE UNIQUE INDEX teaching_assignments_class_wide_unique ON public.teaching_assignments USING btree (school_id, staff_id, class_id) WHERE (section_id IS NULL);
CREATE INDEX teaching_assignments_section_class_school_fk_idx ON public.teaching_assignments USING btree (section_id, school_id, class_id);
CREATE INDEX teaching_assignments_section_school_fk_idx ON public.teaching_assignments USING btree (section_id, school_id);
CREATE UNIQUE INDEX teaching_assignments_section_unique ON public.teaching_assignments USING btree (school_id, staff_id, class_id, section_id) WHERE (section_id IS NOT NULL);
CREATE INDEX teaching_assignments_staff_school_fk_idx ON public.teaching_assignments USING btree (staff_id, school_id);
CREATE INDEX teaching_assignments_teacher_lookup ON public.teaching_assignments USING btree (school_id, staff_id, class_id, section_id);
CREATE INDEX timetable_class_school_idx ON public.timetable_entries USING btree (class_id, school_id);
CREATE INDEX timetable_school_day_idx ON public.timetable_entries USING btree (school_id, day_of_week, starts_at);
CREATE INDEX timetable_section_class_school_fk_idx ON public.timetable_entries USING btree (section_id, school_id, class_id);
CREATE INDEX timetable_section_school_idx ON public.timetable_entries USING btree (section_id, school_id);
CREATE INDEX timetable_teacher_id_idx ON public.timetable_entries USING btree (teacher_id);
CREATE INDEX timetable_teacher_school_fk_idx ON public.timetable_entries USING btree (teacher_id, school_id);

CREATE OR REPLACE FUNCTION public.link_staff_account(p_school_id uuid, p_staff_id uuid, p_user_id uuid, p_email text, p_role text, p_actor_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  staff_row public.staff%rowtype;
  membership_status public.school_record_status;
  member_role public.school_member_role;
begin
  if p_role not in ('teacher','accountant','principal') then
    raise exception 'Unsupported staff portal role';
  end if;
  member_role := p_role::public.school_member_role;

  select * into staff_row
  from public.staff
  where id=p_staff_id and school_id=p_school_id
  for update;
  if not found then raise exception 'Staff record not found'; end if;
  if staff_row.auth_user_id is not null and staff_row.auth_user_id <> p_user_id then
    raise exception 'Staff record is already linked to another account';
  end if;
  if staff_row.portal_role is distinct from p_role then
    raise exception 'Login role must match the staff record portal role';
  end if;
  if staff_row.email is not null and lower(staff_row.email) <> lower(p_email) then
    raise exception 'Invitation email must match the staff record email';
  end if;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_user_id,member_role,'active'::public.school_record_status)
  on conflict (school_id,user_id,role) do nothing;

  select status into membership_status
  from public.school_memberships
  where school_id=p_school_id and user_id=p_user_id and role=member_role
  for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Staff account has a non-active school membership';
  end if;

  update public.staff
  set auth_user_id=p_user_id,email=coalesce(email,lower(p_email))
  where id=p_staff_id and school_id=p_school_id;

  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'staff_account_linked','staff',p_staff_id,
    jsonb_build_object('user_id',p_user_id,'email',lower(p_email),'role',p_role));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.link_student_account(p_school_id uuid, p_student_id uuid, p_user_id uuid, p_email text, p_actor_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  student_row public.students%rowtype;
  membership_status public.school_record_status;
begin
  select * into student_row
  from public.students
  where id = p_student_id and school_id = p_school_id
  for update;
  if not found then raise exception 'Student record not found'; end if;
  if student_row.auth_user_id is not null and student_row.auth_user_id <> p_user_id then
    raise exception 'Student record is already linked to another account';
  end if;
  if student_row.email is not null and lower(student_row.email) <> lower(p_email) then
    raise exception 'Invitation email must match the student record email';
  end if;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_user_id,'student'::public.school_member_role,'active'::public.school_record_status)
  on conflict (school_id,user_id,role) do nothing;

  select status into membership_status
  from public.school_memberships
  where school_id=p_school_id and user_id=p_user_id and role='student'::public.school_member_role
  for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Student account has a non-active school membership';
  end if;

  update public.students
  set auth_user_id=p_user_id, email=coalesce(email,lower(p_email))
  where id=p_student_id and school_id=p_school_id;

  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'student_account_linked','student',p_student_id,
    jsonb_build_object('user_id',p_user_id,'email',lower(p_email)));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.link_student_guardian(p_school_id uuid, p_student_id uuid, p_guardian_user_id uuid, p_guardian_email text, p_relationship text, p_is_primary boolean, p_actor_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  student_exists boolean;
  membership_status public.school_record_status;
  guardian_link_id uuid;
begin
  select exists(select 1 from public.students where id=p_student_id and school_id=p_school_id)
  into student_exists;
  if not student_exists then raise exception 'Student record not found'; end if;
  if length(btrim(p_relationship)) < 2 or length(p_relationship) > 60 then
    raise exception 'Invalid guardian relationship';
  end if;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_guardian_user_id,'parent'::public.school_member_role,'active'::public.school_record_status)
  on conflict (school_id,user_id,role) do nothing;

  select status into membership_status
  from public.school_memberships
  where school_id=p_school_id and user_id=p_guardian_user_id and role='parent'::public.school_member_role
  for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Guardian account has a non-active school membership';
  end if;

  insert into public.student_guardians(
    school_id,student_id,guardian_user_id,guardian_email,relationship,is_primary,verified_at,verified_by
  ) values (
    p_school_id,p_student_id,p_guardian_user_id,lower(p_guardian_email),btrim(p_relationship),coalesce(p_is_primary,false),null,null
  ) returning id into guardian_link_id;

  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'guardian_link_created','student_guardian',guardian_link_id,
    jsonb_build_object('student_id',p_student_id,'guardian_user_id',p_guardian_user_id,'guardian_email',lower(p_guardian_email)));
  return guardian_link_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.provision_school_from_application(p_application_id uuid, p_slug text, p_currency_code character, p_default_locale text, p_timezone text, p_actor_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  application public.school_applications%rowtype;
  created_school_id uuid;
begin
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid school slug'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid ISO currency code'; end if;
  if char_length(p_default_locale)<2 or char_length(p_default_locale)>35 then raise exception 'Invalid locale'; end if;
  if char_length(p_timezone)<1 or char_length(p_timezone)>80 or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then
    raise exception 'Invalid timezone';
  end if;
  select * into application from public.school_applications
  where id=p_application_id and status in ('pending','under_review') for update;
  if not found then raise exception 'Pending school application not found'; end if;

  insert into public.schools(name,slug,country_code,default_locale,currency_code,timezone,status,created_by)
  values(application.school_name,p_slug,application.country_code,p_default_locale,p_currency_code,p_timezone,'active',application.applicant_user_id)
  returning id into created_school_id;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(created_school_id,application.applicant_user_id,'school_admin','active');
  update public.school_applications set status='approved' where id=application.id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(created_school_id,p_actor_user_id,'school_application_approved','school_application',application.id,
    jsonb_build_object('school_name',application.school_name,'applicant_user_id',application.applicant_user_id,'slug',p_slug));
  return created_school_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.record_fee_payment(p_school_id uuid, p_invoice_id uuid, p_amount_minor bigint, p_payment_method text, p_idempotency_key text, p_received_by uuid, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(payment_id uuid, receipt_number text, invoice_status invoice_status)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  invoice_row public.fee_invoices%rowtype;
  existing public.fee_payments%rowtype;
  new_payment_id uuid;
  new_receipt text;
  paid_total bigint;
  next_status public.invoice_status;
begin
  if p_amount_minor <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if p_payment_method not in ('cash','upi','bank_transfer','card','cheque','other') then raise exception 'Invalid payment method'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) < 12 or char_length(p_idempotency_key) > 120 then raise exception 'Invalid idempotency key'; end if;
  select * into invoice_row from public.fee_invoices
   where id=p_invoice_id and school_id=p_school_id for update;
  if not found then raise exception 'Invoice not found'; end if;
  if invoice_row.status not in ('issued','part_paid') then raise exception 'Only issued or partially paid invoices can receive payments'; end if;

  select * into existing from public.fee_payments
   where school_id=p_school_id and idempotency_key=p_idempotency_key;
  if found then
    if existing.invoice_id<>p_invoice_id or existing.amount_minor<>p_amount_minor then
      raise exception 'Idempotency key was already used for a different payment';
    end if;
    return query select existing.id,existing.receipt_number,invoice_row.status;
    return;
  end if;

  select coalesce(sum(amount_minor),0) into paid_total
    from public.fee_payments
   where invoice_id=p_invoice_id and school_id=p_school_id and status='succeeded';
  if p_amount_minor > invoice_row.total_minor-paid_total then
    raise exception 'Payment exceeds the outstanding invoice balance';
  end if;

  new_payment_id := gen_random_uuid();
  new_receipt := 'RCPT-' || upper(substr(replace(new_payment_id::text,'-',''),1,12));
  insert into public.fee_payments(
    id,school_id,invoice_id,amount_minor,currency_code,status,provider,
    provider_reference,idempotency_key,paid_at,receipt_number,payment_method,
    received_by,notes
  ) values (
    new_payment_id,p_school_id,p_invoice_id,p_amount_minor,invoice_row.currency_code,
    'succeeded','manual',new_receipt,p_idempotency_key,now(),new_receipt,
    p_payment_method,p_received_by,nullif(btrim(p_notes),'')
  );

  paid_total := paid_total+p_amount_minor;
  next_status := case when paid_total>=invoice_row.total_minor then 'paid'::public.invoice_status else 'part_paid'::public.invoice_status end;
  update public.fee_invoices set status=next_status where id=p_invoice_id and school_id=p_school_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_received_by,'fee_payment_recorded','fee_payment',new_payment_id,
    jsonb_build_object('invoice_id',p_invoice_id,'amount_minor',p_amount_minor,'currency_code',invoice_row.currency_code,'payment_method',p_payment_method,'receipt_number',new_receipt));
  return query select new_payment_id,new_receipt,next_status;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.review_school_application(p_application_id uuid, p_status text, p_actor_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  application public.school_applications%rowtype;
begin
  if p_status not in ('under_review','rejected') then raise exception 'Unsupported application review status'; end if;
  select * into application from public.school_applications
  where id=p_application_id and status in ('pending','under_review') for update;
  if not found then raise exception 'Pending school application not found'; end if;
  update public.school_applications set status=p_status where id=p_application_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(null,p_actor_user_id,'school_application_'||p_status,'school_application',p_application_id,
    jsonb_build_object('school_name',application.school_name,'status',p_status));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_current_academic_year(p_school_id uuid, p_academic_year_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if not exists(select 1 from public.school_memberships sm where sm.school_id=p_school_id and sm.user_id=(select auth.uid()) and sm.status='active' and sm.role in ('school_admin','principal')) then
  raise exception 'Only school leaders can change the current academic year';
 end if;
 if not exists(select 1 from public.academic_years ay where ay.id=p_academic_year_id and ay.school_id=p_school_id) then
  raise exception 'Academic year not found';
 end if;
 update public.academic_years set is_current=false where school_id=p_school_id and is_current;
 update public.academic_years set is_current=true where id=p_academic_year_id and school_id=p_school_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.verify_student_guardian_link(p_school_id uuid, p_guardian_link_id uuid, p_actor_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  guardian_row public.student_guardians%rowtype;
begin
  select * into guardian_row from public.student_guardians
  where id=p_guardian_link_id and school_id=p_school_id for update;
  if not found then raise exception 'Guardian link not found'; end if;
  if guardian_row.verified_at is not null then raise exception 'Guardian link is already verified'; end if;
  update public.student_guardians
  set verified_at=now(),verified_by=p_actor_user_id
  where id=p_guardian_link_id and school_id=p_school_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'guardian_relationship_verified','student_guardian',p_guardian_link_id,
    jsonb_build_object('student_id',guardian_row.student_id,'guardian_user_id',guardian_row.guardian_user_id));
end;
$function$
;



alter table public.academic_years enable row level security;
alter table public.attendance enable row level security;
alter table public.audit_logs enable row level security;
alter table public.classes enable row level security;
alter table public.exam_results enable row level security;
alter table public.exams enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.fee_payments enable row level security;
alter table public.homework enable row level security;
alter table public.school_applications enable row level security;
alter table public.school_memberships enable row level security;
alter table public.school_notices enable row level security;
alter table public.schools enable row level security;
alter table public.sections enable row level security;
alter table public.staff enable row level security;
alter table public.student_guardians enable row level security;
alter table public.students enable row level security;
alter table public.teaching_assignments enable row level security;
alter table public.timetable_entries enable row level security;

create policy "academic_years delete permitted roles" on public.academic_years as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = academic_years.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "academic_years insert permitted roles" on public.academic_years as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = academic_years.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "academic_years update permitted roles" on public.academic_years as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = academic_years.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = academic_years.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "members can read academic years" on public.academic_years as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = academic_years.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status)))));
create policy "Leaders and assigned teachers delete attendance" on public.attendance as permissive for DELETE to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((students s
     JOIN school_memberships sm ON ((sm.school_id = s.school_id)))
     JOIN teaching_assignments ta ON (((ta.school_id = s.school_id) AND (ta.class_id = s.class_id))))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id)))))));
create policy "Leaders and assigned teachers insert attendance" on public.attendance as permissive for INSERT to authenticated with check (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((students s
     JOIN school_memberships sm ON ((sm.school_id = s.school_id)))
     JOIN teaching_assignments ta ON (((ta.school_id = s.school_id) AND (ta.class_id = s.class_id))))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id)))))));
create policy "Leaders and assigned teachers read attendance" on public.attendance as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((students s
     JOIN school_memberships sm ON ((sm.school_id = s.school_id)))
     JOIN teaching_assignments ta ON (((ta.school_id = s.school_id) AND (ta.class_id = s.class_id))))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id))))) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (((s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
           FROM (student_guardians sg
             JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
          WHERE ((sg.student_id = s.id) AND (sg.school_id = s.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))))))));
create policy "Leaders and assigned teachers update attendance" on public.attendance as permissive for UPDATE to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((students s
     JOIN school_memberships sm ON ((sm.school_id = s.school_id)))
     JOIN teaching_assignments ta ON (((ta.school_id = s.school_id) AND (ta.class_id = s.class_id))))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id))))))) with check (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((students s
     JOIN school_memberships sm ON ((sm.school_id = s.school_id)))
     JOIN teaching_assignments ta ON (((ta.school_id = s.school_id) AND (ta.class_id = s.class_id))))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((s.id = attendance.student_id) AND (s.school_id = attendance.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id)))))));
create policy "audit logs are server only" on public.audit_logs as permissive for ALL to anon, authenticated using (false) with check (false);
create policy "classes delete permitted roles" on public.classes as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = classes.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "classes insert permitted roles" on public.classes as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = classes.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "classes update permitted roles" on public.classes as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = classes.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = classes.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "members can read classes" on public.classes as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = classes.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status)))));
create policy "Leaders teachers and linked families read exam results" on public.exam_results as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
     JOIN students s ON (((s.school_id = ta.school_id) AND (s.class_id = ta.class_id))))
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (s.id = exam_results.student_id) AND ((ta.section_id IS NULL) OR (ta.section_id = s.section_id))))) OR (EXISTS ( SELECT 1
   FROM (exams e
     JOIN students s ON ((s.school_id = e.school_id)))
  WHERE ((e.id = exam_results.exam_id) AND (e.school_id = exam_results.school_id) AND (e.status = 'published'::text) AND (s.id = exam_results.student_id) AND (((s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
           FROM (student_guardians sg
             JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
          WHERE ((sg.student_id = s.id) AND (sg.school_id = s.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))))))));
create policy "School leaders delete exam results" on public.exam_results as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders insert exam results" on public.exam_results as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders update exam results" on public.exam_results as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exam_results.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "Members can read school exams" on public.exams as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exams.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND ((exams.status = 'published'::text) OR (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))));
create policy "School leaders delete exams" on public.exams as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exams.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders insert exams" on public.exams as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exams.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders update exams" on public.exams as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exams.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = exams.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "fee_invoices delete permitted roles" on public.fee_invoices as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'accountant'::school_member_role]))))));
create policy "fee_invoices insert permitted roles" on public.fee_invoices as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'accountant'::school_member_role]))))));
create policy "fee_invoices update permitted roles" on public.fee_invoices as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'accountant'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'accountant'::school_member_role]))))));
create policy "finance staff and linked families can read invoices" on public.fee_invoices as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'accountant'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = fee_invoices.student_id) AND (s.school_id = fee_invoices.school_id) AND (((s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
           FROM (student_guardians sg
             JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
          WHERE ((sg.student_id = s.id) AND (sg.school_id = s.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))))))));
create policy "finance staff and linked families can read payments" on public.fee_payments as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_payments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'accountant'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM (fee_invoices fi
     JOIN students s ON (((s.id = fi.student_id) AND (s.school_id = fi.school_id))))
  WHERE ((fi.id = fee_payments.invoice_id) AND (fi.school_id = fee_payments.school_id) AND (((s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
           FROM (student_guardians sg
             JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
          WHERE ((sg.student_id = s.id) AND (sg.school_id = s.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))))))));
create policy "Leaders and assigned teachers insert homework" on public.homework as permissive for INSERT to authenticated with check (((created_by = ( SELECT auth.uid() AS uid)) AND ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = homework.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = homework.section_id))))))));
create policy "Leaders and assigned teachers update homework" on public.homework as permissive for UPDATE to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = homework.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = homework.section_id))))))) with check (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR ((created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = homework.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = homework.section_id))))))));
create policy "Leaders delete homework" on public.homework as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "Members and assigned teachers can read homework" on public.homework as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'accountant'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = homework.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = homework.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = homework.section_id))))) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.school_id = homework.school_id) AND (s.class_id = homework.class_id) AND ((homework.section_id IS NULL) OR (s.section_id = homework.section_id)) AND (s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))))) OR (EXISTS ( SELECT 1
   FROM ((student_guardians sg
     JOIN students s ON (((s.id = sg.student_id) AND (s.school_id = sg.school_id))))
     JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
  WHERE ((sg.school_id = homework.school_id) AND (s.class_id = homework.class_id) AND ((homework.section_id IS NULL) OR (s.section_id = homework.section_id)) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))));
create policy "Applicants can read their own applications" on public.school_applications as permissive for SELECT to authenticated using ((applicant_user_id = ( SELECT auth.uid() AS uid)));
create policy "Authenticated users can submit school applications" on public.school_applications as permissive for INSERT to authenticated with check (((applicant_user_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text)));
create policy "members can read own memberships" on public.school_memberships as permissive for SELECT to authenticated using ((( SELECT auth.uid() AS uid) = user_id));
create policy "Members can read published notices" on public.school_notices as permissive for SELECT to authenticated using (((published_at IS NOT NULL) AND (published_at <= now()) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = school_notices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND ((school_notices.audience = 'all'::text) OR ((school_notices.audience = 'staff'::text) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'teacher'::school_member_role, 'accountant'::school_member_role]))) OR ((school_notices.audience = 'students'::text) AND (sm.role = 'student'::school_member_role)) OR ((school_notices.audience = 'parents'::text) AND (sm.role = 'parent'::school_member_role))))))));
create policy "School leaders delete notices" on public.school_notices as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = school_notices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders insert notices" on public.school_notices as permissive for INSERT to authenticated with check (((created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = school_notices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))));
create policy "School leaders update notices" on public.school_notices as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = school_notices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check (((created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = school_notices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))));
create policy "members can read their schools" on public.schools as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = schools.id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status)))));
create policy "school leaders update school settings" on public.schools as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = schools.id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = schools.id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "members can read sections" on public.sections as permissive for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = sections.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status)))));
create policy "sections delete permitted roles" on public.sections as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = sections.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "sections insert permitted roles" on public.sections as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = sections.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "sections update permitted roles" on public.sections as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = sections.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = sections.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders and linked staff read staff" on public.staff as permissive for SELECT to authenticated using ((((auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND ((sm.role)::text = staff.portal_role))))) OR (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))));
create policy "staff delete permitted roles" on public.staff as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "staff insert permitted roles" on public.staff as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "staff update permitted roles" on public.staff as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "guardians and school staff can read guardian links" on public.student_guardians as permissive for SELECT to authenticated using ((((guardian_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'teacher'::school_member_role])))))));
create policy "student_guardians delete permitted roles" on public.student_guardians as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "student_guardians insert permitted roles" on public.student_guardians as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "student_guardians update permitted roles" on public.student_guardians as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School roles and linked users read students" on public.students as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'accountant'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = students.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = students.section_id))))) OR ((auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
   FROM (student_guardians sg
     JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
  WHERE ((sg.student_id = students.id) AND (sg.school_id = students.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))));
create policy "students delete permitted roles" on public.students as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "students insert permitted roles" on public.students as permissive for INSERT to authenticated with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "students update permitted roles" on public.students as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = students.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "Leaders and assigned teachers read teaching assignments" on public.teaching_assignments as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = teaching_assignments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM staff st
  WHERE ((st.id = teaching_assignments.staff_id) AND (st.school_id = teaching_assignments.school_id) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)))))));
create policy "School leaders delete teaching assignments" on public.teaching_assignments as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = teaching_assignments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders insert linked teachers" on public.teaching_assignments as permissive for INSERT to authenticated with check (((assigned_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = teaching_assignments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) AND (EXISTS ( SELECT 1
   FROM staff st
  WHERE ((st.id = teaching_assignments.staff_id) AND (st.school_id = teaching_assignments.school_id) AND (st.portal_role = 'teacher'::text) AND (st.auth_user_id IS NOT NULL) AND (st.status = 'active'::school_record_status))))));
create policy "School leaders update linked teacher assignments" on public.teaching_assignments as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = teaching_assignments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check (((assigned_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = teaching_assignments.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) AND (EXISTS ( SELECT 1
   FROM staff st
  WHERE ((st.id = teaching_assignments.staff_id) AND (st.school_id = teaching_assignments.school_id) AND (st.portal_role = 'teacher'::text) AND (st.auth_user_id IS NOT NULL) AND (st.status = 'active'::school_record_status))))));
create policy "School leaders assigned teachers and linked families read timet" on public.timetable_entries as permissive for SELECT to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM ((school_memberships sm
     JOIN teaching_assignments ta ON ((ta.school_id = sm.school_id)))
     JOIN staff st ON (((st.id = ta.staff_id) AND (st.school_id = ta.school_id))))
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = 'teacher'::school_member_role) AND (st.auth_user_id = ( SELECT auth.uid() AS uid)) AND (ta.class_id = timetable_entries.class_id) AND ((ta.section_id IS NULL) OR (ta.section_id = timetable_entries.section_id))))) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.school_id = timetable_entries.school_id) AND (s.class_id = timetable_entries.class_id) AND ((timetable_entries.section_id IS NULL) OR (s.section_id = timetable_entries.section_id)) AND (s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))))) OR (EXISTS ( SELECT 1
   FROM ((student_guardians sg
     JOIN students s ON (((s.id = sg.student_id) AND (s.school_id = sg.school_id))))
     JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
  WHERE ((sg.school_id = timetable_entries.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status) AND (s.class_id = timetable_entries.class_id) AND ((timetable_entries.section_id IS NULL) OR (s.section_id = timetable_entries.section_id)))))));
create policy "School leaders delete timetable" on public.timetable_entries as permissive for DELETE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))));
create policy "School leaders insert timetable" on public.timetable_entries as permissive for INSERT to authenticated with check (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) AND ((teacher_id IS NULL) OR (EXISTS ( SELECT 1
   FROM staff st
  WHERE ((st.id = timetable_entries.teacher_id) AND (st.school_id = timetable_entries.school_id) AND (st.portal_role = 'teacher'::text) AND (st.auth_user_id IS NOT NULL) AND (st.status = 'active'::school_record_status)))))));
create policy "School leaders update timetable" on public.timetable_entries as permissive for UPDATE to authenticated using ((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))) with check (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = timetable_entries.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role]))))) AND ((teacher_id IS NULL) OR (EXISTS ( SELECT 1
   FROM staff st
  WHERE ((st.id = timetable_entries.teacher_id) AND (st.school_id = timetable_entries.school_id) AND (st.portal_role = 'teacher'::text) AND (st.auth_user_id IS NOT NULL) AND (st.status = 'active'::school_record_status)))))));

grant usage on schema public to anon, authenticated, service_role;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.academic_years to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.academic_years to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.attendance to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.attendance to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.audit_logs to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.classes to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.classes to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exam_results to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exam_results to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exams to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.exams to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.fee_invoices to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.fee_invoices to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.fee_payments to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.fee_payments to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.homework to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.homework to service_role;
grant INSERT, SELECT on table public.school_applications to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.school_applications to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.school_memberships to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.school_memberships to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.school_notices to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.school_notices to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.schools to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.schools to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sections to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sections to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.staff to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.staff to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.student_guardians to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.student_guardians to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.students to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.students to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.teaching_assignments to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.teaching_assignments to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.timetable_entries to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.timetable_entries to service_role;
grant SELECT, UPDATE, USAGE on sequence public.audit_logs_id_seq to authenticated;
grant SELECT, UPDATE, USAGE on sequence public.audit_logs_id_seq to service_role;
revoke all on function link_staff_account(uuid,uuid,uuid,text,text,uuid) from public, anon, authenticated, service_role;  grant execute on function link_staff_account(uuid,uuid,uuid,text,text,uuid) to service_role;
revoke all on function link_student_account(uuid,uuid,uuid,text,uuid) from public, anon, authenticated, service_role;  grant execute on function link_student_account(uuid,uuid,uuid,text,uuid) to service_role;
revoke all on function link_student_guardian(uuid,uuid,uuid,text,text,boolean,uuid) from public, anon, authenticated, service_role;  grant execute on function link_student_guardian(uuid,uuid,uuid,text,text,boolean,uuid) to service_role;
revoke all on function provision_school_from_application(uuid,text,character,text,text,uuid) from public, anon, authenticated, service_role;  grant execute on function provision_school_from_application(uuid,text,character,text,text,uuid) to service_role;
revoke all on function record_fee_payment(uuid,uuid,bigint,text,text,uuid,text) from public, anon, authenticated, service_role;  grant execute on function record_fee_payment(uuid,uuid,bigint,text,text,uuid,text) to service_role;
revoke all on function review_school_application(uuid,text,uuid) from public, anon, authenticated, service_role;  grant execute on function review_school_application(uuid,text,uuid) to service_role;
revoke all on function set_current_academic_year(uuid,uuid) from public, anon, authenticated, service_role; grant execute on function set_current_academic_year(uuid,uuid) to authenticated; grant execute on function set_current_academic_year(uuid,uuid) to service_role;
revoke all on function verify_student_guardian_link(uuid,uuid,uuid) from public, anon, authenticated, service_role;  grant execute on function verify_student_guardian_link(uuid,uuid,uuid) to service_role;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from public;
alter default privileges for role postgres in schema public grant all on tables to authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to authenticated, service_role;
alter default privileges for role postgres in schema public grant execute on functions to anon, authenticated, service_role;
