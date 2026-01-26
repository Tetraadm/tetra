-- sync consolidated 09_read_confirmations_rpc
CREATE OR REPLACE FUNCTION public.count_org_instructions(p_org_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT count(*)
    FROM public.instructions
    WHERE org_id = p_org_id
    AND deleted_at IS NULL
    AND status = 'published'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_instruction_read_stats(
  p_org_id uuid,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  instruction_id uuid,
  instruction_title text,
  instruction_created_at timestamptz,
  total_users bigint,
  read_count bigint,
  confirmed_count bigint,
  read_percentage numeric,
  confirmed_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_org_users bigint;
BEGIN
  SELECT count(*) INTO v_total_org_users
  FROM public.profiles
  WHERE org_id = p_org_id;

  RETURN QUERY
  SELECT
    i.id as instruction_id,
    i.title as instruction_title,
    i.created_at as instruction_created_at,
    v_total_org_users as total_users,
    (
      SELECT count(DISTINCT user_id)
      FROM public.instruction_reads ir
      WHERE ir.instruction_id = i.id
    ) as read_count,
    (
      SELECT count(DISTINCT user_id)
      FROM public.instruction_reads ir
      WHERE ir.instruction_id = i.id
      AND ir.confirmed = true
    ) as confirmed_count,
    CASE WHEN v_total_org_users > 0 THEN
      ROUND(
        (SELECT count(DISTINCT user_id) FROM public.instruction_reads ir WHERE ir.instruction_id = i.id)::numeric 
        / v_total_org_users * 100, 
      2)
    ELSE 0 END as read_percentage,
    CASE WHEN v_total_org_users > 0 THEN
      ROUND(
        (SELECT count(DISTINCT user_id) FROM public.instruction_reads ir WHERE ir.instruction_id = i.id AND ir.confirmed = true)::numeric 
        / v_total_org_users * 100, 
      2)
    ELSE 0 END as confirmed_percentage
  FROM public.instructions i
  WHERE i.org_id = p_org_id
  AND i.deleted_at IS NULL
  AND i.status = 'published'
  ORDER BY i.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_instruction_user_reads(
  p_instruction_id uuid,
  p_org_id uuid,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  has_read boolean,
  confirmed boolean,
  read_at timestamptz,
  confirmed_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.full_name as user_name,
    p.email as user_email,
    (ir.id IS NOT NULL) as has_read,
    COALESCE(ir.confirmed, false) as confirmed,
    ir.read_at,
    ir.confirmed_at
  FROM public.profiles p
  LEFT JOIN public.instruction_reads ir 
    ON p.id = ir.user_id 
    AND ir.instruction_id = p_instruction_id
  WHERE p.org_id = p_org_id
  ORDER BY p.full_name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.count_org_instructions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_org_instructions(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.count_org_instructions(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.count_org_instructions(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_instruction_read_stats(uuid, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_instruction_read_stats(uuid, int, int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_instruction_read_stats(uuid, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_instruction_read_stats(uuid, int, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_instruction_user_reads(uuid, uuid, int, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_instruction_user_reads(uuid, uuid, int, int) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_instruction_user_reads(uuid, uuid, int, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_instruction_user_reads(uuid, uuid, int, int) TO service_role;
