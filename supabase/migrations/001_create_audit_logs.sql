-- Create audit_logs table for tracking critical admin actions
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'publish_instruction', 'unpublish_instruction', 'delete_instruction', 'create_user', 'edit_user', 'delete_user', 'invite_user', 'change_role'
  entity_type TEXT NOT NULL, -- 'instruction', 'user', 'invite'
  entity_id UUID, -- ID of the affected entity (nullable for delete operations)
  details JSONB DEFAULT '{}', -- Flexible field for additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);

-- Row Level Security (RLS) policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can read all audit logs in their organization
CREATE POLICY "Admin users can view audit logs in their org"
  ON audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert audit logs (via service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Note: No UPDATE or DELETE policies - audit logs are immutable
