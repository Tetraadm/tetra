-- ============================================================================
-- P0 FIX: BLOCK DIRECT CLIENT STORAGE ACCESS
-- Migration: 24_block_direct_client_storage.sql
-- Date: 2026-01-17
-- ============================================================================
-- CRITICAL: Block all direct client writes to storage.
-- All file operations MUST go through API routes which use service role.
-- This prevents tenant isolation bypass and ensures proper audit logging.
-- ============================================================================

-- Drop existing client-accessible policies
DROP POLICY IF EXISTS "Admins can upload instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete instruction files" ON storage.objects;

-- ============================================================================
-- SELECT: Keep read access for org members (needed for signed URLs)
-- ============================================================================
-- NOTE: "Org members can read instruction files" policy remains unchanged.
-- This is required for signed URL downloads to work.

-- ============================================================================
-- INSERT: BLOCKED - All uploads must go through /api/upload
-- ============================================================================
-- No INSERT policy = no direct client uploads
-- The API uses service role client which bypasses RLS

-- ============================================================================
-- UPDATE: BLOCKED - File updates not supported in current flow
-- ============================================================================
-- No UPDATE policy = no direct client updates
-- If needed in future, create /api/storage/update endpoint

-- ============================================================================
-- DELETE: BLOCKED - All deletes must go through API
-- ============================================================================
-- No DELETE policy = no direct client deletes
-- Create /api/storage/delete endpoint if delete functionality needed

-- ============================================================================
-- VERIFICATION: Run this query to confirm policies are correct
-- ============================================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
--
-- Expected result after migration:
-- - Only ONE policy: "Org members can read instruction files" with cmd = SELECT
-- - No INSERT, UPDATE, or DELETE policies for authenticated role
