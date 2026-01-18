-- ============================================================================
-- P0 FIX: APPLY MISSING STORAGE POLICIES
-- Migration: 20_apply_storage_policies.sql
-- Date: 2026-01-16
-- ============================================================================
-- CRITICAL: Migration 19 was never run on production.
-- This migration applies the missing INSERT/UPDATE/DELETE policies.
-- ============================================================================

-- Drop existing policies (clean slate)
DROP POLICY IF EXISTS "Org members can read instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete instructions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete instruction files" ON storage.objects;

-- ============================================================================
-- SELECT: Org members can read files in their org's folder
-- ============================================================================
CREATE POLICY "Org members can read instruction files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'instructions'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.org_id::text = split_part(name, '/', 1)
    )
  );

-- ============================================================================
-- INSERT: Only admins can upload to their org's folder
-- ============================================================================
CREATE POLICY "Admins can upload instruction files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'instructions'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.org_id::text = split_part(name, '/', 1)
    )
  );

-- ============================================================================
-- UPDATE: Only admins can update files in their org's folder
-- ============================================================================
CREATE POLICY "Admins can update instruction files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'instructions'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.org_id::text = split_part(name, '/', 1)
    )
  );

-- ============================================================================
-- DELETE: Only admins can delete files in their org's folder
-- ============================================================================
CREATE POLICY "Admins can delete instruction files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'instructions'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.org_id::text = split_part(name, '/', 1)
    )
  );
