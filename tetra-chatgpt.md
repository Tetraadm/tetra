# Tetra logg (kort)

## 2026-01-11
- Ryddet norsk UI-tekst (å/ø/æ) i login, admin og employee (inkl. søk/åpne/bruksvilkår).
- Fikset korrupt tekst i norske kommentarer for auth-callback og post-auth.
- Fjernet ubrukte UI-komponenter i src/components/ui/ (ingen imports).
- Beholdt og oppdatert claude-tetra.md med korrekt norsk og oppdatert kontekst.
- Verifisert grønn build med npm run build.

## 2026-01-10
- Synket supabase/sql/01_schema.sql med live DB (UUID defaults, constraints, instruction_reads shape, jsonb defaults, ask_tetra_logs.answer nullable).
- Ryddet RLS-policyer (fjernet duplikater og etablerte kanonisk sett). Kjørt i Supabase som migrasjon policy_cleanup.
- Strammet storage-policyer for instructions bucket til org-basert lesing. Kjørt i Supabase som migrasjon storage_policy_cleanup.
- Oppdatert supabase/sql/05_policy_updates.sql og supabase/sql/07_storage_policies.sql til å reflektere live-DB.
- Fikset profiles RLS-recursion ved å bruke get_profile_context(auth.uid()) i profiles-policyene. Kjørt i Supabase som migrasjon profiles_policy_no_recursion.
- Lagt til profiles.email, backfill fra auth.users, og trigger set_profile_email. Kjørt i Supabase som migrasjon profiles_email_column.
- Forbedret /api/ask: trygg folder/severity-tilgang, og re-enkodet fil til gyldig UTF-8 for build.
- Byttet src/middleware.ts til src/proxy.ts for å fjerne Next.js deprecation warning.
- Upload: send content fra admin ved filopplasting og lagre som instructions.content; keywords basert på title+content.
- AI fallback-tekst endret til: "Finner ingen instrukser med dette innholdet..." (ASCII-variant).
- Auditlogg: logg create_instruction + publish/unpublish ved status-toggle; la til filter/oversettelse.
- Backfill: opprettet create_instruction-hendelser i audit_logs for eksisterende instrukser.

### Supabase status (MCP)
- Public tables: organizations, teams, profiles, folders, instructions, instruction_teams, invites, alerts, alert_teams, ask_tetra_logs, audit_logs, instruction_reads.
- RLS enabled on all public tables.
- Storage bucket: instructions (public=false).
- RLS policies cleaned to a single canonical set; storage policy limited to org-based reads.
