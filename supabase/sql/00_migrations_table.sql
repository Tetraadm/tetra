-- ============================================================================
-- MIGRATIONS TRACKING TABLE
-- ============================================================================
-- Simple table to record which manual SQL migrations have been applied.
-- This is referenced in README verification steps.

create table if not exists public.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
