-- Create instruction_reads table for tracking read confirmations
CREATE TABLE instruction_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id UUID NOT NULL REFERENCES instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(), -- When instruction was first opened (passive tracking)
  confirmed_at TIMESTAMPTZ, -- When user explicitly confirmed understanding (nullable)
  confirmed BOOLEAN DEFAULT FALSE, -- Explicit confirmation flag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instruction_id, user_id) -- One read record per user per instruction
);

-- Create indexes for performance
CREATE INDEX idx_instruction_reads_instruction_id ON instruction_reads(instruction_id);
CREATE INDEX idx_instruction_reads_user_id ON instruction_reads(user_id);
CREATE INDEX idx_instruction_reads_org_id ON instruction_reads(org_id);
CREATE INDEX idx_instruction_reads_confirmed ON instruction_reads(confirmed);
CREATE INDEX idx_instruction_reads_confirmed_at ON instruction_reads(confirmed_at);

-- Row Level Security (RLS) policies
ALTER TABLE instruction_reads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own read records
CREATE POLICY "Users can view own read records"
  ON instruction_reads FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can insert their own read records
CREATE POLICY "Users can insert own read records"
  ON instruction_reads FOR INSERT
  WITH CHECK (user_id = auth.uid() AND org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  ));

-- Policy: Users can update their own read records (for confirmation)
CREATE POLICY "Users can update own read records"
  ON instruction_reads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Admin users can view all read records in their organization
CREATE POLICY "Admin users can view all read records in their org"
  ON instruction_reads FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
