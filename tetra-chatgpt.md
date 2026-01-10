# Tetra logg (kort)

## 2026-01-10
- Synket supabase/sql/01_schema.sql med live DB (UUID defaults, constraints, instruction_reads shape, jsonb defaults, ask_tetra_logs.answer nullable).
- Ryddet RLS-policyer (fjernet duplikater og etablerte kanonisk sett). Kjørt i Supabase som migrasjon policy_cleanup.
- Strammet storage-policyer for instructions bucket til org-basert lesing. Kjørt i Supabase som migrasjon storage_policy_cleanup.
- Oppdatert supabase/sql/05_policy_updates.sql og supabase/sql/07_storage_policies.sql til å reflektere live-DB.
