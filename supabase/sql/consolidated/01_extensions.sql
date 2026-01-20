-- ============================================================================
-- TETRIVO HMS - 01_extensions.sql
-- ============================================================================
-- KJØR FØRST: Aktiverer nødvendige PostgreSQL-extensions
-- Denne filen har ingen avhengigheter og må kjøres før alle andre.
-- ============================================================================

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Vector search for AI (pgvector)
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify extensions are installed:
-- SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');
-- ============================================================================
