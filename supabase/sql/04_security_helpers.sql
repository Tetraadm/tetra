-- ============================================================================
-- SECURITY HELPER FUNCTIONS (SECURITY DEFINER to prevent RLS recursion)
-- ============================================================================

-- Helper function to get profile with org and team data
-- Bypasses RLS to prevent infinite recursion when profiles RLS checks org/teams
create or replace function public.get_profile_context(p_user_id uuid)
returns table (
  id uuid,
  full_name text,
  role text,
  org_id uuid,
  team_id uuid,
  created_at timestamptz,
  org_name text,
  team_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- SECURITY: Prevent cross-user data access
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.role,
    p.org_id,
    p.team_id,
    p.created_at,
    o.name as org_name,
    t.name as team_name
  from profiles p
  left join organizations o on o.id = p.org_id
  left join teams t on t.id = p.team_id
  where p.id = p_user_id;
end;
$$;

-- Helper function to get instructions for a user
-- Bypasses RLS to prevent recursion when checking instruction_teams
create or replace function public.get_user_instructions(p_user_id uuid)
returns table (
  id uuid,
  title text,
  content text,
  severity text,
  file_path text,
  folder_id uuid,
  created_at timestamptz,
  keywords jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  -- SECURITY: Prevent cross-user data access
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  -- Get user's profile
  select * into v_profile from profiles where profiles.id = p_user_id;

  if not found then
    return;
  end if;

  -- Return instructions for user's team OR org-wide (no team mappings)
  return query
  select distinct
    i.id,
    i.title,
    i.content,
    i.severity,
    i.file_path,
    i.folder_id,
    i.created_at,
    i.keywords
  from instructions i
  where i.org_id = v_profile.org_id
    and i.status = 'published'
    and (
      -- User has a team and instruction is assigned to their team
      (v_profile.team_id is not null
       and exists (
         select 1 from instruction_teams it
         where it.instruction_id = i.id
         and it.team_id = v_profile.team_id
       ))
      or
      -- Instruction has no team assignments (visible to all in org)
      not exists (
        select 1 from instruction_teams it
        where it.instruction_id = i.id
      )
    )
  order by i.created_at desc;
end;
$$;

-- Helper function to get alerts for a user
-- Bypasses RLS to prevent recursion when checking alert_teams
create or replace function public.get_user_alerts(p_user_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  severity text,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
begin
  -- SECURITY: Prevent cross-user data access
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  -- Get user's profile
  select * into v_profile from profiles where profiles.id = p_user_id;

  if not found then
    return;
  end if;

  -- Return alerts for user's team OR org-wide (no team mappings)
  return query
  select distinct
    a.id,
    a.title,
    a.description,
    a.severity,
    a.active,
    a.created_at
  from alerts a
  where a.org_id = v_profile.org_id
    and a.active = true
    and (
      -- User has a team and alert is assigned to their team
      (v_profile.team_id is not null
       and exists (
         select 1 from alert_teams at
         where at.alert_id = a.id
         and at.team_id = v_profile.team_id
       ))
      or
      -- Alert has no team assignments (visible to all in org)
      not exists (
        select 1 from alert_teams at
        where at.alert_id = a.id
      )
    )
  order by a.severity, a.created_at desc;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_profile_context(uuid) to authenticated;
grant execute on function public.get_user_instructions(uuid) to authenticated;
grant execute on function public.get_user_alerts(uuid) to authenticated;
