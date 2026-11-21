DROP POLICY IF EXISTS "School leaders assigned teachers and linked families read timetable" ON public.timetable_entries;
CREATE POLICY "School leaders assigned teachers and linked families read timetable"
ON public.timetable_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.school_memberships sm
    WHERE sm.school_id = timetable_entries.school_id
      AND sm.user_id = (SELECT auth.uid())
      AND sm.status = 'active'
      AND sm.role IN ('school_admin','principal')
  )
  OR EXISTS (
    SELECT 1
    FROM public.school_memberships sm
    JOIN public.teaching_assignments ta ON ta.school_id = sm.school_id
    JOIN public.staff st ON st.id = ta.staff_id AND st.school_id = ta.school_id
    WHERE sm.school_id = timetable_entries.school_id
      AND sm.user_id = (SELECT auth.uid())
      AND sm.status = 'active'
      AND sm.role = 'teacher'
      AND st.auth_user_id = (SELECT auth.uid())
      AND ta.class_id = timetable_entries.class_id
      AND (ta.section_id IS NULL OR ta.section_id = timetable_entries.section_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.school_id = timetable_entries.school_id
      AND s.class_id = timetable_entries.class_id
      AND (timetable_entries.section_id IS NULL OR s.section_id = timetable_entries.section_id)
      AND s.auth_user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.student_guardians sg
    JOIN public.students s ON s.id = sg.student_id AND s.school_id = sg.school_id
    WHERE sg.school_id = timetable_entries.school_id
      AND sg.guardian_user_id = (SELECT auth.uid())
      AND sg.verified_at IS NOT NULL
      AND s.class_id = timetable_entries.class_id
      AND (timetable_entries.section_id IS NULL OR s.section_id = timetable_entries.section_id)
  )
);