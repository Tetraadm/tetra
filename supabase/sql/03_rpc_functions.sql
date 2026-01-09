-- ============================================================================
-- RPC FUNCTIONS FOR INVITE FLOW
-- ============================================================================

-- Get invite by token (bypasses RLS for public invite viewing)
create or replace function public.get_invite_by_token(p_token text)
returns table (
  id uuid,
  token text,
  org_id uuid,
  team_id uuid,
  role text,
  used boolean,
  created_at timestamptz,
  organization_name text,
  team_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    i.id,
    i.token,
    i.org_id,
    i.team_id,
    i.role,
    i.used,
    i.created_at,
    o.name as organization_name,
    t.name as team_name
  from invites i
  left join organizations o on o.id = i.org_id
  left join teams t on t.id = i.team_id
  where i.token = p_token
  limit 1;
end;
$$;

-- Accept invite and create/update profile (atomic operation)
create or replace function public.accept_invite(p_token text, p_full_name text default null)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv invites%rowtype;
  v_uid uuid;
  v_profile profiles%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Must be authenticated to accept invite';
  end if;

  -- Lock and get invite
  select *
  into v_inv
  from invites
  where token = p_token
    and used = false
  for update;

  if not found then
    raise exception 'Invalid or used invite token';
  end if;

  -- Check if expired (7 days from created_at)
  if v_inv.created_at + interval '7 days' < now() then
    raise exception 'Invite has expired';
  end if;

  -- Upsert profile
  insert into profiles (id, full_name, role, org_id, team_id)
  values (v_uid, p_full_name, v_inv.role, v_inv.org_id, v_inv.team_id)
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, profiles.full_name),
        role      = excluded.role,
        org_id    = excluded.org_id,
        team_id   = excluded.team_id;

  -- Mark invite as used
  update invites set used = true where id = v_inv.id;

  -- Return profile
  select * into v_profile from profiles where id = v_uid;
  return v_profile;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_invite_by_token(text) to anon, authenticated;
grant execute on function public.accept_invite(text, text) to authenticated;
