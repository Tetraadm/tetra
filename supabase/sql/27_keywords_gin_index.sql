-- ============================================================================
-- GIN INDEX FOR KEYWORDS JSONB SEARCH OPTIMIZATION
-- Migration: 27_keywords_gin_index.sql
-- Date: 2026-01-16
-- ============================================================================
-- This migration adds a GIN index on the keywords JSONB column to improve
-- AI search performance in the "Spør Tetra" feature.
-- ============================================================================

-- Create GIN index on keywords column for fast JSON containment queries
-- Using jsonb_ops for full JSONB operator support
CREATE INDEX IF NOT EXISTS idx_instructions_keywords_gin
ON public.instructions
USING GIN (keywords jsonb_ops);

-- Also index the updated_at column for recent-first ordering (used in get_user_instructions)
CREATE INDEX IF NOT EXISTS idx_instructions_updated_at
ON public.instructions (updated_at DESC NULLS LAST)
WHERE deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION (run after migration)
-- ============================================================================
-- Check index exists:
-- SELECT indexname, indexdef FROM pg_indexes 
-- WHERE tablename = 'instructions' AND indexname LIKE 'idx_instructions_%';
--
-- Test query uses index (should show "Bitmap Index Scan" or "Index Scan"):
-- EXPLAIN ANALYZE 
-- SELECT * FROM instructions 
-- WHERE keywords @> '["brann"]'::jsonb;
-- ============================================================================

