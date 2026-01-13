-- ============================================================================
-- SOFT DELETE + AUDIT IMPROVEMENTS
-- Migration: 18_soft_delete_audit.sql
-- Date: 2026-01-13
-- ============================================================================
-- This migration adds:
-- 1. deleted_at column to instructions, alerts, folders for soft-delete
-- 2. Updated RLS policies to exclude soft-deleted rows by default
-- 3. Index on deleted_at for performance
-- ============================================================================

-- ============================================================================
-- PART 1: ADD deleted_at COLUMNS
-- ============================================================================

-- Add deleted_at to instructions
ALTER TABLE public.instructions
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Add deleted_at to alerts
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Add deleted_at to folders
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- ============================================================================
-- PART 2: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Partial indexes for non-deleted rows (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_instructions_not_deleted
ON public.instructions (org_id, status)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_not_deleted
ON public.alerts (org_id, active)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_folders_not_deleted
ON public.folders (org_id)
WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 3: UPDATE RLS POLICIES FOR INSTRUCTIONS
-- ============================================================================

-- Drop existing instruction policies (old + consolidated)
DROP POLICY IF EXISTS "Users can view published instructions in their org" ON public.instructions;
DROP POLICY IF EXISTS "Admins can view all instructions in their org" ON public.instructions;
DROP POLICY IF EXISTS "Admins can manage instructions" ON public.instructions;
DROP POLICY IF EXISTS "Read org instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins can insert instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins can update instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins can delete instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins can view deleted instructions in their org" ON public.instructions;

-- Recreate with deleted_at filter (consolidated policy names)
CREATE POLICY "Read org instructions"
  ON public.instructions FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      (org_id = my_org_id() AND status = 'published')
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'admin'
          AND p.org_id = instructions.org_id
      )
    )
  );

-- Admin can still view deleted instructions for audit purposes
CREATE POLICY "Admins can view deleted instructions in their org"
  ON public.instructions FOR SELECT
  USING (
    deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

CREATE POLICY "Admins can insert instructions"
  ON public.instructions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

CREATE POLICY "Admins can update instructions"
  ON public.instructions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

CREATE POLICY "Admins can delete instructions"
  ON public.instructions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );

-- ============================================================================
-- PART 4: UPDATE RLS POLICIES FOR ALERTS
-- ============================================================================

-- Drop existing alert policies (old + consolidated)
DROP POLICY IF EXISTS "Users can view active alerts in their org" ON public.alerts;
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view all alerts in their org" ON public.alerts;
DROP POLICY IF EXISTS "Read org alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view deleted alerts in their org" ON public.alerts;

-- Recreate with deleted_at filter (consolidated policy names)
CREATE POLICY "Read org alerts"
  ON public.alerts FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      (org_id = my_org_id() AND active = true)
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'admin'
          AND p.org_id = alerts.org_id
      )
    )
  );

-- Admin can still view deleted alerts for audit purposes
CREATE POLICY "Admins can view deleted alerts in their org"
  ON public.alerts FOR SELECT
  USING (
    deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

CREATE POLICY "Admins can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

CREATE POLICY "Admins can update alerts"
  ON public.alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

CREATE POLICY "Admins can delete alerts"
  ON public.alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

-- ============================================================================
-- PART 5: UPDATE RLS POLICIES FOR FOLDERS
-- ============================================================================

-- Drop existing folder policies (old + consolidated)
DROP POLICY IF EXISTS "Read org folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can manage folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can insert folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can view deleted folders in their org" ON public.folders;

-- Recreate with deleted_at filter (consolidated policy names)
CREATE POLICY "Read org folders"
  ON public.folders FOR SELECT
  USING (
    org_id = my_org_id()
    AND deleted_at IS NULL
  );

-- Admin can still view deleted folders for audit purposes
CREATE POLICY "Admins can view deleted folders in their org"
  ON public.folders FOR SELECT
  USING (
    deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

CREATE POLICY "Admins can insert folders"
  ON public.folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

CREATE POLICY "Admins can update folders"
  ON public.folders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

CREATE POLICY "Admins can delete folders"
  ON public.folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

-- ============================================================================
-- PART 6: ADD AUDIT LOG INDEX FOR BETTER QUERY PERFORMANCE
-- ============================================================================

-- Composite index for common audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_action_created
ON public.audit_logs (org_id, action_type, created_at DESC);

-- ============================================================================
-- PART 7: UPDATE RPC FUNCTIONS TO EXCLUDE SOFT-DELETED ROWS
-- ============================================================================

-- get_user_instructions: add deleted_at filter
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
      and i.deleted_at is null
      and (
        not exists (select 1 from instruction_teams sub where sub.instruction_id = i.id)
        or it.team_id = v_profile.team_id
      )
    group by i.id;
end;
$$;

-- get_user_alerts: add deleted_at filter
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
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  select * into v_profile from profiles where profiles.id = p_user_id;
  if not found then
    return;
  end if;

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
    and a.deleted_at is null
    and (
      (v_profile.team_id is not null
       and exists (
         select 1 from alert_teams at
         where at.alert_id = a.id
         and at.team_id = v_profile.team_id
       ))
      or
      not exists (
        select 1 from alert_teams at
        where at.alert_id = a.id
      )
    )
  order by a.severity, a.created_at desc;
end;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================
--
-- Check columns were added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('instructions', 'alerts', 'folders')
--   AND column_name = 'deleted_at';
--
-- Check indexes were created:
-- SELECT indexname FROM pg_indexes
-- WHERE indexname LIKE 'idx_%_not_deleted';
--
-- Check policies exist:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE tablename IN ('instructions', 'alerts', 'folders')
-- ORDER BY tablename, policyname;
-- ============================================================================
