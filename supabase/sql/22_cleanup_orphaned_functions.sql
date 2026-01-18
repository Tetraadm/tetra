-- ============================================================================
-- P1 FIX: CLEANUP ORPHANED FUNCTIONS
-- Migration: 22_cleanup_orphaned_functions.sql
-- Date: 2026-01-16
-- ============================================================================
-- These functions exist in production DB but are not documented in repo SQL.
-- After audit review, confirmed they are either:
-- - Old signatures replaced by newer versions
-- - Unused helper functions from early development
-- ============================================================================

-- Drop old accept_invite signature (replaced by accept_invite(text, text))
DROP FUNCTION IF EXISTS public.accept_invite(text);

-- Drop get_invite (duplicates get_invite_by_token functionality)
DROP FUNCTION IF EXISTS public.get_invite(text);

-- Drop current_profile_context (no frontend usage found)
DROP FUNCTION IF EXISTS public.current_profile_context();

-- Drop instruction_team_allowed (no frontend usage found)
DROP FUNCTION IF EXISTS public.instruction_team_allowed(uuid);

-- ============================================================================
-- NOTE: set_profile_email() is NOT dropped here.
-- It's documented in 23_document_profile_email_trigger.sql as it's actively
-- used by the profiles table trigger.
-- ============================================================================
