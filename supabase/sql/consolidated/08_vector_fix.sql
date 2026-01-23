-- 08_vector_fix.sql

-- Verify vector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Add embedding column to instructions if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'instructions' AND column_name = 'embedding') THEN
        ALTER TABLE public.instructions ADD COLUMN embedding vector(1536);
    END IF;
END $$;

-- Create index for faster similarity search
CREATE INDEX IF NOT EXISTS instructions_embedding_idx 
ON public.instructions 
USING hnsw (embedding vector_cosine_ops);

-- Create match_instructions function
CREATE OR REPLACE FUNCTION public.match_instructions(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  severity text,
  folder_id uuid,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
BEGIN
  -- SECURITY: Prevent cross-user data access
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.title,
    i.content,
    i.severity,
    i.folder_id,
    i.updated_at,
    1 - (i.embedding <=> query_embedding) as similarity
  FROM public.instructions i
  WHERE 1 - (i.embedding <=> query_embedding) > match_threshold
  AND i.status = 'published'
  AND i.deleted_at IS NULL
  AND i.org_id = v_profile.org_id
  AND (
    (v_profile.team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.instruction_teams it
        WHERE it.instruction_id = i.id
        AND it.team_id = v_profile.team_id
      ))
    OR NOT EXISTS (
      SELECT 1 FROM public.instruction_teams it
      WHERE it.instruction_id = i.id
    )
  )
  ORDER BY i.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Restrict execution permissions
REVOKE EXECUTE ON FUNCTION public.match_instructions(vector(1536), float, int, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_instructions(vector(1536), float, int, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_instructions(vector(1536), float, int, uuid) TO authenticated;
