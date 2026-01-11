-- ============================================================================
-- accept_invite RPC
-- Creates/updates profile for the authenticated user based on invite token.
-- Enforces: valid token (<7 days, not used), session present, org/team/role set.
-- ============================================================================

create or replace function public.accept_invite(
  p_token text,
  p_full_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
  v_user_id uuid;
  v_email text;
  v_full_name text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Resolve email from JWT claims if available
  select current_setting('request.jwt.claims', true)::json ->> 'email'
  into v_email;

  -- Find a valid, unused invite (max age 7 days)
  select *
  into v_invite
  from public.invites
  where token = p_token
    and used = false
    and created_at > now() - interval '7 days'
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_invite';
  end if;

  v_full_name := coalesce(nullif(p_full_name, ''), split_part(coalesce(v_email, ''), '@', 1), 'Bruker');

  -- Upsert profile with role/org/team from invite
  insert into public.profiles (id, full_name, email, role, org_id, team_id)
  values (v_user_id, v_full_name, v_email, v_invite.role, v_invite.org_id, v_invite.team_id)
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        org_id = excluded.org_id,
        team_id = excluded.team_id;

  -- Mark invite as used
  update public.invites
  set used = true
  where id = v_invite.id;

  return;
end;
$$;

grant execute on function public.accept_invite(text, text) to authenticated;
