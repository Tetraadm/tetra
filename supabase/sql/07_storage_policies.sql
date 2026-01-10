-- ============================================================================
-- STORAGE POLICIES FOR INSTRUCTIONS BUCKET
-- ============================================================================
-- Enforce org-level access to files stored under: org_id/filename

drop policy if exists "Authenticated can delete instructions" on storage.objects;
drop policy if exists "Authenticated can read instructions" on storage.objects;
drop policy if exists "Authenticated can update instructions" on storage.objects;
drop policy if exists "Authenticated can upload instructions" on storage.objects;
drop policy if exists "Org members can read instruction files" on storage.objects;

create policy "Org members can read instruction files"
  on storage.objects for select
  using (
    bucket_id = 'instructions'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.org_id::text = split_part(name, '/', 1)
    )
  );
