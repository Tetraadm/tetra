-- ============================================================================
-- TETRIVO HMS - 02_schema.sql
-- ============================================================================
-- KJØR ETTER: 01_extensions.sql
-- Oppretter alle tabeller med constraints, foreign keys, og indekser.
-- GDPR: Dataminimering - kun nødvendige felter lagres.
-- 
-- NOTE: gen_random_uuid() is built-in to PostgreSQL 13+ (in pg_catalog).
-- Supabase uses PostgreSQL 15+, so no qualification needed.
-- For crypto functions, we use extensions.gen_random_bytes() explicitly.
-- ============================================================================

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations (multi-tenant root)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.organizations IS 'Root entity for multi-tenancy. All data is scoped to an organization.';

-- Teams (within organizations)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.teams IS 'Teams within an organization. Used for instruction/alert targeting.';

-- Profiles (extends auth.users)
-- GDPR: Only stores necessary PII (name, email). Email synced from auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teamleader', 'employee')),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users. GDPR: Contains PII (name, email).';
COMMENT ON COLUMN public.profiles.email IS 'GDPR: PII field. Auto-synced from auth.users via trigger.';

-- Folders (for organizing instructions)
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Instructions (core HMS content)
CREATE TABLE IF NOT EXISTS public.instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  file_path TEXT,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  keywords JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.instructions IS 'HMS instructions. Core content for compliance training.';

-- Instruction-Team mapping (many-to-many)
CREATE TABLE IF NOT EXISTS public.instruction_teams (
  instruction_id UUID NOT NULL REFERENCES public.instructions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (instruction_id, team_id)
);

-- Instruction reads tracking
CREATE TABLE IF NOT EXISTS public.instruction_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id UUID NOT NULL REFERENCES public.instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  confirmed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (instruction_id, user_id)
);

-- Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'critical')),
  active BOOLEAN DEFAULT TRUE NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Alert-Team mapping (many-to-many)
CREATE TABLE IF NOT EXISTS public.alert_teams (
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (alert_id, team_id)
);

-- Invites
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teamleader', 'employee')),
  used BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.invites IS 'Invitation tokens. Expires after 7 days via RPC check.';

-- ============================================================================
-- AUDIT & LOGGING TABLES (GDPR: 90-day retention)
-- ============================================================================

-- Audit logs
-- GDPR: Minimal PII. user_id for accountability, details for context.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.audit_logs IS 'GDPR: Audit trail. Auto-deleted after 90 days via cleanup function.';

-- Ask Tetra logs (AI queries)
-- GDPR: Logs questions for quality assurance. 90-day retention.
CREATE TABLE IF NOT EXISTS public.ask_tetra_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT,
  source_instruction_id UUID REFERENCES public.instructions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.ask_tetra_logs IS 'GDPR: AI query logs. Auto-deleted after 90 days.';

-- AI unanswered questions
CREATE TABLE IF NOT EXISTS public.ai_unanswered_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.ai_unanswered_questions IS 'GDPR: Unanswered AI questions for review. 90-day retention.';

-- GDPR retention runs (audit trail for cleanup)
CREATE TABLE IF NOT EXISTS public.gdpr_retention_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  retention_days INTEGER NOT NULL,
  audit_logs_deleted BIGINT,
  ask_tetra_logs_deleted BIGINT,
  unanswered_questions_deleted BIGINT,
  executed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

COMMENT ON TABLE public.gdpr_retention_runs IS 'GDPR: Audit trail for data retention cleanup runs.';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruction_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_tetra_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_unanswered_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_retention_runs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Foreign key indexes (required for efficient JOINs and CASCADE deletes)
CREATE INDEX IF NOT EXISTS idx_teams_org_id ON public.teams(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_folders_org_id ON public.folders(org_id);
CREATE INDEX IF NOT EXISTS idx_instructions_org_id ON public.instructions(org_id);
CREATE INDEX IF NOT EXISTS idx_instructions_folder_id ON public.instructions(folder_id);
CREATE INDEX IF NOT EXISTS idx_instructions_created_by ON public.instructions(created_by);
CREATE INDEX IF NOT EXISTS idx_instruction_teams_team_id ON public.instruction_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_instruction_reads_instruction_id ON public.instruction_reads(instruction_id);
CREATE INDEX IF NOT EXISTS idx_instruction_reads_user_id ON public.instruction_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_instruction_reads_org_id ON public.instruction_reads(org_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org_id ON public.alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_alert_teams_team_id ON public.alert_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_invites_org_id ON public.invites(org_id);
CREATE INDEX IF NOT EXISTS idx_invites_team_id ON public.invites(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ask_tetra_logs_org_id ON public.ask_tetra_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ask_tetra_logs_user_id ON public.ask_tetra_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_unanswered_questions_org_id ON public.ai_unanswered_questions(org_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_instructions_status ON public.instructions(status);
CREATE INDEX IF NOT EXISTS idx_instructions_severity ON public.instructions(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(active);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_used ON public.invites(used);
CREATE INDEX IF NOT EXISTS idx_instruction_reads_confirmed ON public.instruction_reads(confirmed);

-- GDPR retention indexes (for efficient date-based cleanup)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ask_tetra_logs_created_at ON public.ask_tetra_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_unanswered_questions_created_at ON public.ai_unanswered_questions(created_at DESC);

-- GIN index for keyword search
CREATE INDEX IF NOT EXISTS idx_instructions_keywords ON public.instructions USING GIN (keywords);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
