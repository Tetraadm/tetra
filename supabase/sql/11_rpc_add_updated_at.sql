-- Add updated_at to get_user_instructions RPC function
-- This allows SpДr Tetra to show when instructions were last updated

create or replace function public.get_user_instructions(p_user_id uuid)
returns table (
  id uuid,
  title text,
  content text,
  severity text,
  file_path text,
  folder_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
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

  select * into v_profile from profiles where profiles.id = p_user_id;
  if not found then
    raise exception 'user not found';
  end if;

  return query
    select
      i.id,
      i.title,
      i.content,
      i.severity,
      i.file_path,
      i.folder_id,
      i.created_at,
      i.updated_at,
      i.keywords
    from instructions i
    left join instruction_teams it on i.id = it.instruction_id
    where
      i.org_id = v_profile.org_id
      and i.status = 'published'
      and (
        not exists (select 1 from instruction_teams sub where sub.instruction_id = i.id)
        or it.team_id = v_profile.team_id
      )
    group by i.id;
end;
$$;
