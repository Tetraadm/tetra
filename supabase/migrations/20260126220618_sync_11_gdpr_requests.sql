-- sync consolidated 11_gdpr_requests
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    reason TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_org_id ON public.gdpr_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON public.gdpr_requests(status);

DROP TRIGGER IF EXISTS set_gdpr_requests_updated_at ON public.gdpr_requests;

CREATE TRIGGER set_gdpr_requests_updated_at
    BEFORE UPDATE ON public.gdpr_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own deletion request" ON public.gdpr_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.gdpr_requests;
DROP POLICY IF EXISTS "Admins can view org requests" ON public.gdpr_requests;
DROP POLICY IF EXISTS "Admins can update org requests" ON public.gdpr_requests;

CREATE POLICY "Users can create own deletion request"
    ON public.gdpr_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own requests"
    ON public.gdpr_requests
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

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

    SELECT role, org_id INTO v_caller_role, v_caller_org
    FROM public.profiles
    WHERE id = v_caller_id;

    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'forbidden: admin required';
    END IF;

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

    SELECT public.gdpr_hard_delete_user(v_request.user_id, TRUE) INTO v_deletion_result;

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

GRANT EXECUTE ON FUNCTION public.process_gdpr_deletion_request(UUID) TO authenticated;

GRANT SELECT, INSERT ON public.gdpr_requests TO authenticated;
GRANT UPDATE (status, admin_notes, processed_by, processed_at) ON public.gdpr_requests TO authenticated;
