-- ============================================================================
-- RPC FUNCTIONS FOR INVITE FLOW
-- ============================================================================

-- Get invite by token (bypasses RLS for public invite viewing)
-- SECURITY: Only returns unused, non-expired invites
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
    and i.used = false
    and i.created_at > now() - interval '7 days'
  limit 1;
end;
$$;

-- Grant execute permissions
grant execute on function public.get_invite_by_token(text) to anon, authenticated;

-- ============================================================================
-- NOTE: accept_invite() function is NOT defined in this file
-- ============================================================================
-- The accept_invite() function already exists in your database with a specific
-- return type that the application depends on. DO NOT modify or redefine it here.
--
-- If you need to update accept_invite() in the future, do it carefully via
-- a separate migration that preserves the return type signature.
-- ============================================================================
