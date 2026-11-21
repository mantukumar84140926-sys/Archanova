-- SCHOOLVERSE: atomic and auditable account linking
-- Applied to Supabase project aemrcfitcndgmeabfdpn on 2026-11-21.
-- All functions are SECURITY INVOKER and executable only by service_role.

create or replace function public.link_student_account(
  p_school_id uuid, p_student_id uuid, p_user_id uuid, p_email text, p_actor_user_id uuid
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  student_row public.students%rowtype;
  membership_status public.school_record_status;
begin
  select * into student_row from public.students
  where id=p_student_id and school_id=p_school_id for update;
  if not found then raise exception 'Student record not found'; end if;
  if student_row.auth_user_id is not null and student_row.auth_user_id<>p_user_id then
    raise exception 'Student record is already linked to another account';
  end if;
  if student_row.email is not null and lower(student_row.email)<>lower(p_email) then
    raise exception 'Invitation email must match the student record email';
  end if;
  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_user_id,'student'::public.school_member_role,'active'::public.school_record_status)
  on conflict(school_id,user_id,role) do nothing;
  select status into membership_status from public.school_memberships
  where school_id=p_school_id and user_id=p_user_id and role='student'::public.school_member_role for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Student account has a non-active school membership';
  end if;
  update public.students set auth_user_id=p_user_id,email=coalesce(email,lower(p_email))
  where id=p_student_id and school_id=p_school_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'student_account_linked','student',p_student_id,
    jsonb_build_object('user_id',p_user_id,'email',lower(p_email)));
end;
$$;

create or replace function public.link_staff_account(
  p_school_id uuid, p_staff_id uuid, p_user_id uuid, p_email text, p_role text, p_actor_user_id uuid
) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  staff_row public.staff%rowtype;
  membership_status public.school_record_status;
  member_role public.school_member_role;
begin
  if p_role not in ('teacher','accountant','principal') then raise exception 'Unsupported staff portal role'; end if;
  member_role:=p_role::public.school_member_role;
  select * into staff_row from public.staff where id=p_staff_id and school_id=p_school_id for update;
  if not found then raise exception 'Staff record not found'; end if;
  if staff_row.auth_user_id is not null and staff_row.auth_user_id<>p_user_id then
    raise exception 'Staff record is already linked to another account';
  end if;
  if staff_row.portal_role is distinct from p_role then raise exception 'Login role must match the staff record portal role'; end if;
  if staff_row.email is not null and lower(staff_row.email)<>lower(p_email) then
    raise exception 'Invitation email must match the staff record email';
  end if;
  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_user_id,member_role,'active'::public.school_record_status)
  on conflict(school_id,user_id,role) do nothing;
  select status into membership_status from public.school_memberships
  where school_id=p_school_id and user_id=p_user_id and role=member_role for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Staff account has a non-active school membership';
  end if;
  update public.staff set auth_user_id=p_user_id,email=coalesce(email,lower(p_email))
  where id=p_staff_id and school_id=p_school_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'staff_account_linked','staff',p_staff_id,
    jsonb_build_object('user_id',p_user_id,'email',lower(p_email),'role',p_role));
end;
$$;

create or replace function public.link_student_guardian(
  p_school_id uuid, p_student_id uuid, p_guardian_user_id uuid, p_guardian_email text,
  p_relationship text, p_is_primary boolean, p_actor_user_id uuid
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  student_exists boolean;
  membership_status public.school_record_status;
  guardian_link_id uuid;
begin
  select exists(select 1 from public.students where id=p_student_id and school_id=p_school_id)
  into student_exists;
  if not student_exists then raise exception 'Student record not found'; end if;
  if length(btrim(p_relationship))<2 or length(p_relationship)>60 then raise exception 'Invalid guardian relationship'; end if;
  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,p_guardian_user_id,'parent'::public.school_member_role,'active'::public.school_record_status)
  on conflict(school_id,user_id,role) do nothing;
  select status into membership_status from public.school_memberships
  where school_id=p_school_id and user_id=p_guardian_user_id and role='parent'::public.school_member_role for update;
  if membership_status is distinct from 'active'::public.school_record_status then
    raise exception 'Guardian account has a non-active school membership';
  end if;
  insert into public.student_guardians(
    school_id,student_id,guardian_user_id,guardian_email,relationship,is_primary,verified_at,verified_by
  ) values(p_school_id,p_student_id,p_guardian_user_id,lower(p_guardian_email),btrim(p_relationship),coalesce(p_is_primary,false),null,null)
  returning id into guardian_link_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'guardian_link_created','student_guardian',guardian_link_id,
    jsonb_build_object('student_id',p_student_id,'guardian_user_id',p_guardian_user_id,'guardian_email',lower(p_guardian_email)));
  return guardian_link_id;
end;
$$;

revoke all on function public.link_student_account(uuid,uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.link_staff_account(uuid,uuid,uuid,text,text,uuid) from public,anon,authenticated;
revoke all on function public.link_student_guardian(uuid,uuid,uuid,text,text,boolean,uuid) from public,anon,authenticated;
grant execute on function public.link_student_account(uuid,uuid,uuid,text,uuid) to service_role;
grant execute on function public.link_staff_account(uuid,uuid,uuid,text,text,uuid) to service_role;
grant execute on function public.link_student_guardian(uuid,uuid,uuid,text,text,boolean,uuid) to service_role;
