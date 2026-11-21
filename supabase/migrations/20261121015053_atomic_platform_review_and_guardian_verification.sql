-- Atomic platform application review/provisioning and guardian verification.
-- Applied to Supabase project aemrcfitcndgmeabfdpn on 2026-11-21.
-- SECURITY INVOKER functions are callable only by service_role.

drop function if exists public.provision_school_from_application(uuid,text,character,text,text);
create or replace function public.provision_school_from_application(
  p_application_id uuid,p_slug text,p_currency_code character,p_default_locale text,p_timezone text,p_actor_user_id uuid
) returns uuid language plpgsql security invoker set search_path=''
as $$
declare application public.school_applications%rowtype; created_school_id uuid;
begin
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Invalid school slug'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid ISO currency code'; end if;
  if char_length(p_default_locale)<2 or char_length(p_default_locale)>35 then raise exception 'Invalid locale'; end if;
  if char_length(p_timezone)<1 or char_length(p_timezone)>80 or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise exception 'Invalid timezone'; end if;
  select * into application from public.school_applications where id=p_application_id and status in ('pending','under_review') for update;
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
$$;

create or replace function public.review_school_application(p_application_id uuid,p_status text,p_actor_user_id uuid)
returns void language plpgsql security invoker set search_path=''
as $$
declare application public.school_applications%rowtype;
begin
  if p_status not in ('under_review','rejected') then raise exception 'Unsupported application review status'; end if;
  select * into application from public.school_applications where id=p_application_id and status in ('pending','under_review') for update;
  if not found then raise exception 'Pending school application not found'; end if;
  update public.school_applications set status=p_status where id=p_application_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(null,p_actor_user_id,'school_application_'||p_status,'school_application',p_application_id,
    jsonb_build_object('school_name',application.school_name,'status',p_status));
end;
$$;

create or replace function public.verify_student_guardian_link(p_school_id uuid,p_guardian_link_id uuid,p_actor_user_id uuid)
returns void language plpgsql security invoker set search_path=''
as $$
declare guardian_row public.student_guardians%rowtype;
begin
  select * into guardian_row from public.student_guardians where id=p_guardian_link_id and school_id=p_school_id for update;
  if not found then raise exception 'Guardian link not found'; end if;
  if guardian_row.verified_at is not null then raise exception 'Guardian link is already verified'; end if;
  update public.student_guardians set verified_at=now(),verified_by=p_actor_user_id
  where id=p_guardian_link_id and school_id=p_school_id;
  insert into public.audit_logs(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,'guardian_relationship_verified','student_guardian',p_guardian_link_id,
    jsonb_build_object('student_id',guardian_row.student_id,'guardian_user_id',guardian_row.guardian_user_id));
end;
$$;

revoke all on function public.provision_school_from_application(uuid,text,character,text,text,uuid) from public,anon,authenticated;
revoke all on function public.review_school_application(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.verify_student_guardian_link(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.provision_school_from_application(uuid,text,character,text,text,uuid) to service_role;
grant execute on function public.review_school_application(uuid,text,uuid) to service_role;
grant execute on function public.verify_student_guardian_link(uuid,uuid,uuid) to service_role;
