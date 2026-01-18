-- ============================================================================
-- P0 FIX: READ CONFIRMATIONS AGGREGATION RPC
-- Migration: 25_read_confirmations_rpc.sql
-- Date: 2026-01-17
-- ============================================================================
-- Creates RPC function to efficiently fetch read confirmation stats.
-- Returns paginated aggregated data instead of building N*M matrix in memory.
-- ============================================================================

-- ============================================================================
-- Function: get_instruction_read_stats
-- Returns paginated instruction read statistics for an organization
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
BEGIN
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_instruction_read_stats(UUID, INT, INT) TO authenticated;

-- ============================================================================
-- Function: get_instruction_user_reads
-- Returns paginated user read status for a specific instruction
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
BEGIN
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_instruction_user_reads(UUID, UUID, INT, INT) TO authenticated;

-- ============================================================================
-- Function: count_org_instructions
-- Returns total count of published instructions for pagination
-- ============================================================================
CREATE OR REPLACE FUNCTION public.count_org_instructions(p_org_id UUID)
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.instructions
  WHERE org_id = p_org_id
    AND status = 'published'
    AND deleted_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_org_instructions(UUID) TO authenticated;
