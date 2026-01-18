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

-- Explicitly block client-side writes (service role bypasses RLS)
create policy "Deny instruction file uploads"
  on storage.objects for insert
  with check (false);

create policy "Deny instruction file updates"
  on storage.objects for update
  using (false);

create policy "Deny instruction file deletes"
  on storage.objects for delete
  using (false);
