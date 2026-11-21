-- Keep linked student, parent, and staff reads gated by an active school membership.
-- Generated from the verified live SELECT policies after applying this migration.

drop policy if exists "Leaders and assigned teachers read attendance" on public.attendance;
create policy "Leaders and assigned teachers read attendance" on public.attendance for select to authenticated using (((EXISTS ( SELECT 1
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

drop policy if exists "Leaders teachers and linked families read exam results" on public.exam_results;
create policy "Leaders teachers and linked families read exam results" on public.exam_results for select to authenticated using (((EXISTS ( SELECT 1
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

drop policy if exists "finance staff and linked families can read invoices" on public.fee_invoices;
create policy "finance staff and linked families can read invoices" on public.fee_invoices for select to authenticated using (((EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = fee_invoices.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'accountant'::school_member_role]))))) OR (EXISTS ( SELECT 1
   FROM students s
  WHERE ((s.id = fee_invoices.student_id) AND (s.school_id = fee_invoices.school_id) AND (((s.auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
           FROM school_memberships sm
          WHERE ((sm.school_id = s.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'student'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
           FROM (student_guardians sg
             JOIN school_memberships sm ON (((sm.school_id = sg.school_id) AND (sm.user_id = sg.guardian_user_id))))
          WHERE ((sg.student_id = s.id) AND (sg.school_id = s.school_id) AND (sg.guardian_user_id = ( SELECT auth.uid() AS uid)) AND (sg.verified_at IS NOT NULL) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))))))));

drop policy if exists "finance staff and linked families can read payments" on public.fee_payments;
create policy "finance staff and linked families can read payments" on public.fee_payments for select to authenticated using (((EXISTS ( SELECT 1
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

drop policy if exists "Members and assigned teachers can read homework" on public.homework;
create policy "Members and assigned teachers can read homework" on public.homework for select to authenticated using (((EXISTS ( SELECT 1
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

drop policy if exists "School leaders and linked staff read staff" on public.staff;
create policy "School leaders and linked staff read staff" on public.staff for select to authenticated using ((((auth_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND ((sm.role)::text = staff.portal_role))))) OR (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = staff.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role])))))));

drop policy if exists "guardians and school staff can read guardian links" on public.student_guardians;
create policy "guardians and school staff can read guardian links" on public.student_guardians for select to authenticated using ((((guardian_user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.role = 'parent'::school_member_role) AND (sm.status = 'active'::school_record_status))))) OR (EXISTS ( SELECT 1
   FROM school_memberships sm
  WHERE ((sm.school_id = student_guardians.school_id) AND (sm.user_id = ( SELECT auth.uid() AS uid)) AND (sm.status = 'active'::school_record_status) AND (sm.role = ANY (ARRAY['school_admin'::school_member_role, 'principal'::school_member_role, 'teacher'::school_member_role])))))));

drop policy if exists "School roles and linked users read students" on public.students;
create policy "School roles and linked users read students" on public.students for select to authenticated using (((EXISTS ( SELECT 1
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

drop policy if exists "School leaders assigned teachers and linked families read timet" on public.timetable_entries;
create policy "School leaders assigned teachers and linked families read timet" on public.timetable_entries for select to authenticated using (((EXISTS ( SELECT 1
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
