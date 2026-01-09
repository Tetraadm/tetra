-- ============================================================================
-- TETRA HMS SEED DATA
-- ============================================================================
-- This file creates bootstrap data for local development
-- Run AFTER 01_schema.sql
-- ============================================================================

-- Insert demo organization
insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Demo Org')
on conflict (id) do nothing;

-- Insert demo teams
insert into public.teams (id, name, org_id)
values
  ('00000000-0000-0000-0000-000000000011', 'Admin Team', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000012', 'Safety Team', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000013', 'Operations Team', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Insert demo folders
insert into public.folders (id, name, org_id)
values
  ('00000000-0000-0000-0000-000000000021', 'Safety Procedures', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000022', 'Equipment Manuals', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000023', 'Emergency Protocols', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Note: Profiles are created via invite flow, not seed data
-- To create a demo admin user:
-- 1. Sign up via Supabase Auth UI (creates entry in auth.users)
-- 2. Manually insert into profiles table:
--
-- insert into public.profiles (id, full_name, role, org_id, team_id)
-- values (
--   'YOUR-AUTH-USER-UUID',
--   'Demo Admin',
--   'admin',
--   '00000000-0000-0000-0000-000000000001',
--   '00000000-0000-0000-0000-000000000011'
-- );
