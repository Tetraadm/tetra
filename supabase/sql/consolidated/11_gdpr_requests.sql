-- ============================================================================
-- TETRIVO HMS - 11_gdpr_requests.sql
-- ============================================================================
-- KJØR ETTER: 07_gdpr.sql
-- GDPR deletion request workflow for multi-tenant
-- ============================================================================

-- ============================================================================
-- TABLE: gdpr_requests
-- Stores user deletion requests for admin approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    reason TEXT, -- Optional: user's reason for deletion
    admin_notes TEXT, -- Admin can add notes
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_org_id ON public.gdpr_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests(status);

-- Updated_at trigger
CREATE TRIGGER set_gdpr_requests_updated_at
    BEFORE UPDATE ON public.gdpr_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Users can create requests for themselves
CREATE POLICY "Users can create own deletion request"
    ON public.gdpr_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
    ON public.gdpr_requests
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all requests in their org
CREATE POLICY "Admins can view org requests"
    ON public.gdpr_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND org_id = gdpr_requests.org_id
        )
    );

-- Admins can update requests in their org
CREATE POLICY "Admins can update org requests"
    ON public.gdpr_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND org_id = gdpr_requests.org_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
            AND org_id = gdpr_requests.org_id
        )
    );

-- ============================================================================
-- FUNCTION: Process approved deletion request
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_gdpr_deletion_request(p_request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request RECORD;
    v_caller_id UUID;
    v_caller_role TEXT;
    v_caller_org UUID;
    v_deletion_result JSONB;
BEGIN
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'not_authenticated';
    END IF;

    -- Get caller context
    SELECT role, org_id INTO v_caller_role, v_caller_org
    FROM public.profiles
    WHERE id = v_caller_id;

    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'forbidden: admin required';
    END IF;

    -- Get request
    SELECT * INTO v_request
    FROM public.gdpr_requests
    WHERE id = p_request_id;

    IF v_request IS NULL THEN
        RAISE EXCEPTION 'request_not_found';
    END IF;

    IF v_request.org_id <> v_caller_org THEN
        RAISE EXCEPTION 'forbidden: wrong org';
    END IF;

    IF v_request.status <> 'approved' THEN
        RAISE EXCEPTION 'request_not_approved';
    END IF;

    -- Execute the hard delete
    SELECT public.gdpr_hard_delete_user(v_request.user_id, TRUE) INTO v_deletion_result;

    -- Update request status
    UPDATE public.gdpr_requests
    SET 
        status = 'completed',
        processed_by = v_caller_id,
        processed_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'request_id', p_request_id,
        'deletion_result', v_deletion_result
    );
END;
$$;

COMMENT ON FUNCTION public.process_gdpr_deletion_request IS 
'Processes an approved GDPR deletion request. Admin only.';

-- Grant execute to authenticated (internal checks handle authorization)
GRANT EXECUTE ON FUNCTION public.process_gdpr_deletion_request(UUID) TO authenticated;

-- ============================================================================
-- GRANT TABLE ACCESS
-- ============================================================================
GRANT SELECT, INSERT ON public.gdpr_requests TO authenticated;
GRANT UPDATE (status, admin_notes, processed_by, processed_at) ON public.gdpr_requests TO authenticated;
