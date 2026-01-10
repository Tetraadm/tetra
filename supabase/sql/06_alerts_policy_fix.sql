-- ============================================================================
-- ALERTS POLICY FIX (REMOVE RECURSION)
-- ============================================================================
-- This replaces team-aware alert policies that can cause recursion.

-- Drop existing policies (names from current DB + repo)
drop policy if exists "Read active alerts (team-aware)" on public.alerts;
drop policy if exists "Users can view active alerts in their org" on public.alerts;
drop policy if exists "Admin manage alerts" on public.alerts;
drop policy if exists "Admins can manage alerts" on public.alerts;

drop policy if exists "Read alert-team mappings (only for visible alerts)" on public.alert_teams;
drop policy if exists "Admin manage alert-team mappings" on public.alert_teams;
drop policy if exists "Admins can manage alert team links" on public.alert_teams;

-- Alerts: allow org users to read active alerts (no team join to avoid recursion)
create policy "Users can view active alerts in their org"
  on public.alerts for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
    and active = true
  );

-- Alerts: admin full access
create policy "Admins can manage alerts"
  on public.alerts for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = alerts.org_id
    )
  );

-- Alert-team mappings: admin only (join alerts for org check)
create policy "Admins can manage alert team links"
  on public.alert_teams for all
  using (
    exists (
      select 1
      from public.profiles p
      join public.alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.alerts a on a.id = alert_teams.alert_id
      where p.id = auth.uid()
        and p.role = 'admin'
        and p.org_id = a.org_id
    )
  );
