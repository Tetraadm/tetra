-- sync consolidated 06_storage
DROP POLICY IF EXISTS "Authenticated can delete instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update instructions" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload instructions" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Deny instruction file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Deny instruction file updates" ON storage.objects;
DROP POLICY IF EXISTS "Deny instruction file deletes" ON storage.objects;
DROP POLICY IF EXISTS "Org members read instruction files" ON storage.objects;
DROP POLICY IF EXISTS "Block client file uploads" ON storage.objects;
DROP POLICY IF EXISTS "Block client file updates" ON storage.objects;
DROP POLICY IF EXISTS "Block client file deletes" ON storage.objects;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instructions',
  'instructions',
  FALSE,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];

CREATE POLICY "Org members read instruction files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'instructions'
    AND EXISTS (
      SELECT 1
      FROM public.instructions i
      JOIN public.profiles p ON p.id = (SELECT auth.uid())
      WHERE i.file_path = storage.objects.name
        AND i.status = 'published'
        AND i.deleted_at IS NULL
        AND i.org_id = p.org_id
        AND (
          (p.team_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.instruction_teams it
            WHERE it.instruction_id = i.id
              AND it.team_id = p.team_id
          ))
          OR NOT EXISTS (
            SELECT 1 FROM public.instruction_teams it
            WHERE it.instruction_id = i.id
          )
        )
    )
  );

CREATE POLICY "Block client file uploads"
  ON storage.objects FOR INSERT
  WITH CHECK (FALSE);

CREATE POLICY "Block client file updates"
  ON storage.objects FOR UPDATE
  USING (FALSE);

CREATE POLICY "Block client file deletes"
  ON storage.objects FOR DELETE
  USING (FALSE);
