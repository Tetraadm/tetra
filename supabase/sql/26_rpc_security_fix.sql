-- ============================================================================
-- SECURITY FIX: RPC ORG VALIDATION + PROFILES DELETED_AT
-- Migration: 26_rpc_security_fix.sql
-- Date: 2026-01-18
-- ============================================================================
-- Fixes:
-- 1. Adds deleted_at column to profiles table (referenced but missing)
-- 2. Adds org membership validation to SECURITY DEFINER RPCs
-- ============================================================================

-- ============================================================================
-- PART 1: ADD deleted_at TO PROFILES
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for soft-delete performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 2: SECURE RPC FUNCTIONS WITH ORG VALIDATION
-- ============================================================================

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- Function: get_instruction_read_stats (SECURED)
-- Now validates caller belongs to requested org
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_instruction_read_stats(
  p_org_id UUID,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  instruction_id UUID,
  instruction_title TEXT,
  instruction_created_at TIMESTAMPTZ,
  total_users BIGINT,
  read_count BIGINT,
  confirmed_count BIGINT,
  read_percentage NUMERIC,
  confirmed_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users BIGINT;
  v_caller_org_id UUID;
BEGIN
  -- SECURITY: Verify caller belongs to requested org
  SELECT org_id INTO v_caller_org_id FROM public.profiles WHERE id = auth.uid();
  
  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Access denied: You do not belong to this organization';
  END IF;

  -- Get total non-admin users in org (cached for all rows)
  SELECT COUNT(*) INTO v_total_users
  FROM public.profiles
  WHERE org_id = p_org_id AND role != 'admin' AND deleted_at IS NULL;

  RETURN QUERY
  SELECT
    i.id AS instruction_id,
    i.title AS instruction_title,
    i.created_at AS instruction_created_at,
    v_total_users AS total_users,
    COUNT(ir.id) AS read_count,
    COUNT(ir.id) FILTER (WHERE ir.confirmed = true) AS confirmed_count,
    CASE WHEN v_total_users > 0 
      THEN ROUND((COUNT(ir.id)::NUMERIC / v_total_users) * 100, 1)
      ELSE 0 
    END AS read_percentage,
    CASE WHEN v_total_users > 0 
      THEN ROUND((COUNT(ir.id) FILTER (WHERE ir.confirmed = true)::NUMERIC / v_total_users) * 100, 1)
      ELSE 0 
    END AS confirmed_percentage
  FROM public.instructions i
  LEFT JOIN public.instruction_reads ir ON ir.instruction_id = i.id AND ir.org_id = p_org_id
  WHERE i.org_id = p_org_id
    AND i.status = 'published'
    AND i.deleted_at IS NULL
  GROUP BY i.id, i.title, i.created_at
  ORDER BY i.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- Function: get_instruction_user_reads (SECURED)
-- Now validates caller belongs to requested org
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_instruction_user_reads(
  p_instruction_id UUID,
  p_org_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  has_read BOOLEAN,
  confirmed BOOLEAN,
  read_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org_id UUID;
BEGIN
  -- SECURITY: Verify caller belongs to requested org
  SELECT org_id INTO v_caller_org_id FROM public.profiles WHERE id = auth.uid();
  
  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Access denied: You do not belong to this organization';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(p.full_name, '') AS user_name,
    COALESCE(p.email, '') AS user_email,
    (ir.id IS NOT NULL) AS has_read,
    COALESCE(ir.confirmed, false) AS confirmed,
    ir.read_at,
    ir.confirmed_at
  FROM public.profiles p
  LEFT JOIN public.instruction_reads ir 
    ON ir.user_id = p.id 
    AND ir.instruction_id = p_instruction_id
  WHERE p.org_id = p_org_id
    AND p.role != 'admin'
    AND p.deleted_at IS NULL
  ORDER BY p.full_name ASC NULLS LAST
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- Function: count_org_instructions (SECURED)
-- Now validates caller belongs to requested org
-- ============================================================================
CREATE OR REPLACE FUNCTION public.count_org_instructions(p_org_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_org_id UUID;
  v_count BIGINT;
BEGIN
  -- SECURITY: Verify caller belongs to requested org
  SELECT org_id INTO v_caller_org_id FROM public.profiles WHERE id = auth.uid();
  
  IF v_caller_org_id IS NULL OR v_caller_org_id != p_org_id THEN
    RAISE EXCEPTION 'Access denied: You do not belong to this organization';
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.instructions
  WHERE org_id = p_org_id
    AND status = 'published'
    AND deleted_at IS NULL;
    
  RETURN v_count;
END;
$$;

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_instruction_read_stats(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_instruction_user_reads(UUID, UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_org_instructions(UUID) TO authenticated;
