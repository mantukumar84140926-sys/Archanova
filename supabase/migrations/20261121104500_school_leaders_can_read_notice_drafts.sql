-- Forward migration: school_leaders_can_read_notice_drafts (20261121104500).
-- Allow active school leaders to review both published notices and saved drafts.
-- The existing audience-scoped policy continues to control visibility for all other members.
CREATE POLICY "School leaders can read all notices"
ON public.school_notices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.school_memberships sm
    WHERE sm.school_id = school_notices.school_id
      AND sm.user_id = (SELECT auth.uid())
      AND sm.status = 'active'
      AND sm.role IN ('school_admin', 'principal')
  )
);
