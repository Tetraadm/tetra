-- ============================================================================
-- 09_instruction_chunks.sql
-- ============================================================================
-- Creates table for storing document chunks with embeddings and full-text search
--
-- PERFORMANCE OPTIMIZATIONS (2026-01-28):
-- 1. Uses (SELECT auth.uid()) subquery pattern
-- 2. Split admin policies into INSERT/UPDATE/DELETE to avoid overlap
-- 3. Single consolidated SELECT policy
-- ============================================================================

-- Create instruction_chunks table
CREATE TABLE IF NOT EXISTS public.instruction_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id uuid NOT NULL REFERENCES public.instructions(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(768),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('norwegian', content)) STORED,
  created_at timestamptz DEFAULT now(),
  UNIQUE(instruction_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
ON public.instruction_chunks
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS chunks_fts_idx
ON public.instruction_chunks
USING gin (fts);

CREATE INDEX IF NOT EXISTS chunks_instruction_idx
ON public.instruction_chunks (instruction_id);

-- Enable RLS
ALTER TABLE public.instruction_chunks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Users can view chunks from accessible instructions" ON public.instruction_chunks;
DROP POLICY IF EXISTS "Admins can manage chunks for their org instructions" ON public.instruction_chunks;
DROP POLICY IF EXISTS "Admins manage chunks" ON public.instruction_chunks;
DROP POLICY IF EXISTS "View org chunks" ON public.instruction_chunks;
DROP POLICY IF EXISTS "View chunks" ON public.instruction_chunks;
DROP POLICY IF EXISTS "Admins insert chunks" ON public.instruction_chunks;
DROP POLICY IF EXISTS "Admins update chunks" ON public.instruction_chunks;
DROP POLICY IF EXISTS "Admins delete chunks" ON public.instruction_chunks;

-- ============================================================================
-- RLS POLICIES (optimized - no duplicate permissive policies)
-- ============================================================================

-- Consolidated SELECT: admins see all org chunks, users see accessible chunks
CREATE POLICY "View chunks"
ON public.instruction_chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM instructions i
    JOIN profiles p ON p.org_id = i.org_id
    WHERE i.id = instruction_chunks.instruction_id
      AND p.id = (SELECT auth.uid())
      AND (
        -- Admin can see all chunks in org
        p.role = 'admin'
        OR
        -- Others can see chunks from published instructions they have team access to
        (
          i.status = 'published'
          AND i.deleted_at IS NULL
          AND (
            (p.team_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM instruction_teams it
              WHERE it.instruction_id = i.id AND it.team_id = p.team_id
            ))
            OR NOT EXISTS (
              SELECT 1 FROM instruction_teams it WHERE it.instruction_id = i.id
            )
          )
        )
      )
  )
);

-- Admin INSERT policy
CREATE POLICY "Admins insert chunks"
ON public.instruction_chunks
FOR INSERT
WITH CHECK (
  get_my_role() = 'admin'
  AND EXISTS (
    SELECT 1 FROM instructions i
    WHERE i.id = instruction_chunks.instruction_id
      AND i.org_id = get_my_org_id()
  )
);

-- Admin UPDATE policy
CREATE POLICY "Admins update chunks"
ON public.instruction_chunks
FOR UPDATE
USING (
  get_my_role() = 'admin'
  AND EXISTS (
    SELECT 1 FROM instructions i
    WHERE i.id = instruction_chunks.instruction_id
      AND i.org_id = get_my_org_id()
  )
)
WITH CHECK (
  get_my_role() = 'admin'
  AND EXISTS (
    SELECT 1 FROM instructions i
    WHERE i.id = instruction_chunks.instruction_id
      AND i.org_id = get_my_org_id()
  )
);

-- Admin DELETE policy
CREATE POLICY "Admins delete chunks"
ON public.instruction_chunks
FOR DELETE
USING (
  get_my_role() = 'admin'
  AND EXISTS (
    SELECT 1 FROM instructions i
    WHERE i.id = instruction_chunks.instruction_id
      AND i.org_id = get_my_org_id()
  )
);

-- ============================================================================
-- HYBRID SEARCH FUNCTION
-- Combines vector similarity and full-text search using Reciprocal Rank Fusion
-- ============================================================================
DROP FUNCTION IF EXISTS public.match_chunks_hybrid(vector(768), text, int, uuid);

CREATE OR REPLACE FUNCTION public.match_chunks_hybrid(
  query_embedding vector(768),
  query_text text,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  instruction_id uuid,
  title text,
  content text,
  severity text,
  folder_id uuid,
  updated_at timestamptz,
  combined_score float,
  matched_chunk text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  k constant int := 60;
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
  WITH
  vector_results AS (
    SELECT
      c.instruction_id AS v_instruction_id,
      c.content AS v_chunk_content,
      1 - (c.embedding <=> query_embedding) AS v_similarity,
      ROW_NUMBER() OVER (ORDER BY c.embedding <=> query_embedding) AS v_rank
    FROM public.instruction_chunks c
    JOIN public.instructions i ON i.id = c.instruction_id
    WHERE i.status = 'published'
      AND i.deleted_at IS NULL
      AND i.org_id = v_profile.org_id
      AND (
        (v_profile.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.instruction_teams it
          WHERE it.instruction_id = i.id
            AND it.team_id = v_profile.team_id
        ))
        OR NOT EXISTS (
          SELECT 1 FROM public.instruction_teams it
          WHERE it.instruction_id = i.id
        )
      )
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) > 0.2
    LIMIT match_count * 3
  ),
  fts_results AS (
    SELECT
      c.instruction_id AS f_instruction_id,
      c.content AS f_chunk_content,
      ts_rank_cd(c.fts, websearch_to_tsquery('norwegian', query_text)) AS f_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(c.fts, websearch_to_tsquery('norwegian', query_text)) DESC) AS f_rank
    FROM public.instruction_chunks c
    JOIN public.instructions i ON i.id = c.instruction_id
    WHERE i.status = 'published'
      AND i.deleted_at IS NULL
      AND i.org_id = v_profile.org_id
      AND (
        (v_profile.team_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM public.instruction_teams it
          WHERE it.instruction_id = i.id
            AND it.team_id = v_profile.team_id
        ))
        OR NOT EXISTS (
          SELECT 1 FROM public.instruction_teams it
          WHERE it.instruction_id = i.id
        )
      )
      AND c.fts @@ websearch_to_tsquery('norwegian', query_text)
    LIMIT match_count * 3
  ),
  combined AS (
    SELECT
      COALESCE(v.v_instruction_id, f.f_instruction_id) AS c_instruction_id,
      COALESCE(v.v_chunk_content, f.f_chunk_content) AS c_chunk_content,
      COALESCE(1.0 / (k + v.v_rank), 0) + COALESCE(1.0 / (k + f.f_rank), 0) AS c_rrf_score
    FROM vector_results v
    FULL OUTER JOIN fts_results f
      ON v.v_instruction_id = f.f_instruction_id AND v.v_chunk_content = f.f_chunk_content
  ),
  best_per_instruction AS (
    SELECT
      c.c_instruction_id,
      c.c_chunk_content,
      c.c_rrf_score,
      ROW_NUMBER() OVER (PARTITION BY c.c_instruction_id ORDER BY c.c_rrf_score DESC) AS rn
    FROM combined c
  )
  SELECT
    i.id AS instruction_id,
    i.title::text AS title,
    i.content::text AS content,
    i.severity::text AS severity,
    i.folder_id AS folder_id,
    i.updated_at AS updated_at,
    bpi.c_rrf_score::float AS combined_score,
    bpi.c_chunk_content::text AS matched_chunk
  FROM best_per_instruction bpi
  JOIN public.instructions i ON i.id = bpi.c_instruction_id
  WHERE bpi.rn = 1
  ORDER BY bpi.c_rrf_score DESC
  LIMIT match_count;
END;
$$;

-- Restrict execution permissions
REVOKE EXECUTE ON FUNCTION public.match_chunks_hybrid(vector(768), text, int, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_chunks_hybrid(vector(768), text, int, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_chunks_hybrid(vector(768), text, int, uuid) TO authenticated;
