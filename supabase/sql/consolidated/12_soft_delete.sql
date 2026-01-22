-- ============================================================================
-- TETRIVO HMS - 12_soft_delete.sql
-- ============================================================================
-- KJØR ETTER: 11_gdpr_requests.sql
-- Legger til deleted_at kolonne for soft-delete støtte.
-- Kode refererer til denne kolonnen i:
--   - src/app/api/upload/route.ts
--   - src/app/(platform)/instructions/admin/hooks/useAdminInstructions.ts
--   - src/app/(platform)/instructions/admin/hooks/useAdminAlerts.ts
--   - supabase/sql/consolidated/08_vector_fix.sql
--   - supabase/sql/consolidated/09_read_confirmations_rpc.sql
-- ============================================================================

-- Add deleted_at column to instructions table
ALTER TABLE public.instructions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.instructions.deleted_at IS 'GDPR: Soft-delete timestamp. Null = active, set = logically deleted.';

-- Add deleted_at column to alerts table (for consistency with hooks)
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.alerts.deleted_at IS 'GDPR: Soft-delete timestamp for alerts.';

-- Add deleted_at column to folders table (for consistency)
ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.folders.deleted_at IS 'GDPR: Soft-delete timestamp for folders.';

-- Index for efficient filtering of active (non-deleted) records
CREATE INDEX IF NOT EXISTS idx_instructions_deleted_at ON public.instructions(deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_deleted_at ON public.alerts(deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON public.folders(deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify columns exist:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('instructions', 'alerts', 'folders') AND column_name = 'deleted_at';
-- ============================================================================
