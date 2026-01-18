-- ============================================================================
-- P1 FIX: CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- Migration: 21_consolidate_policies_final.sql
-- Date: 2026-01-16
-- ============================================================================
-- Supabase advisor flagged multiple permissive SELECT policies on:
-- - alerts (Read org alerts + Admins can view deleted alerts)
-- - folders (Read org folders + Admins can view deleted folders)
-- - instructions (Read org instructions + Admins can view deleted instructions)
--
-- This migration consolidates each pair into a single policy for performance.
-- ============================================================================

-- ============================================================================
-- ALERTS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Read org alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view deleted alerts in their org" ON public.alerts;

CREATE POLICY "Read org alerts"
  ON public.alerts FOR SELECT
  USING (
    -- Non-deleted, active alerts visible to org members
    (deleted_at IS NULL AND org_id = my_org_id() AND active = true)
    OR
    -- Admins can see all alerts (including deleted/inactive) in their org
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = alerts.org_id
    )
  );

-- ============================================================================
-- FOLDERS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Read org folders" ON public.folders;
DROP POLICY IF EXISTS "Admins can view deleted folders in their org" ON public.folders;

CREATE POLICY "Read org folders"
  ON public.folders FOR SELECT
  USING (
    -- Non-deleted folders visible to org members
    (org_id = my_org_id() AND deleted_at IS NULL)
    OR
    -- Admins can see all folders (including deleted) in their org
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = folders.org_id
    )
  );

-- ============================================================================
-- INSTRUCTIONS: Consolidate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Read org instructions" ON public.instructions;
DROP POLICY IF EXISTS "Admins can view deleted instructions in their org" ON public.instructions;

CREATE POLICY "Read org instructions"
  ON public.instructions FOR SELECT
  USING (
    -- Non-deleted, published instructions visible to org members
    (deleted_at IS NULL AND org_id = my_org_id() AND status = 'published')
    OR
    -- Admins can see all instructions (including deleted/draft) in their org
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
        AND p.org_id = instructions.org_id
    )
  );
