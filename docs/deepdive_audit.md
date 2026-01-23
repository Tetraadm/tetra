Jeg har sammenlignet innholdet i docs/Audit codebase thoroughly.docx med repoet (lokalt), og er delvis enig: flere kritiske punkter er bekreftet, men flere docx‑påstander støttes ikke av kodebasen slik den står nå.

Antakelse
- Antakelse: team‑isolasjon er et sikkerhetskrav; hvis team ikke er en sikkerhetsgrense, nedgrader funn knyttet til team‑filtering fra High til Medium.

Implementerte tiltak (kodeendringer, krever migrering/utrulling)
- RPC‑binding: match_instructions og match_chunks_hybrid sjekker nå auth.uid() = p_user_id og håndhever team‑tilgang; EXECUTE er revoket fra PUBLIC/anon og kun gitt til authenticated (supabase/sql/consolidated/08_vector_fix.sql, supabase/sql/consolidated/09_instruction_chunks.sql).
- Team‑RLS: instrukser har team‑scopet SELECT‑policy, og instruction_chunks‑SELECT følger samme team‑logikk (supabase/sql/consolidated/05_policies.sql, supabase/sql/consolidated/09_instruction_chunks.sql).
- instruction_chunks‑policy: admin‑policy har nå WITH CHECK for org‑binding ved insert/update (supabase/sql/consolidated/09_instruction_chunks.sql).
- Storage‑policy: fil‑tilgang krever at bruker har tilgang til instruksen via team‑logikk og file_path (supabase/sql/consolidated/06_storage.sql).

Implementerte tiltak runde 2 (API + GDPR-forbedringer)
- Service-role client: /api/read-confirmations bruker nå service-role client for RPC-kall som kun er GRANTet til service_role (src/lib/supabase/server.ts:44, src/app/api/read-confirmations/route.ts:31).
- Bekreftet org_id: /api/confirm-read henter org_id fra profile i stedet for RPC-retur for å unngå null-verdier (src/app/api/confirm-read/route.ts:28).
- Rate-limit fallback: /api/contact har nå in-memory rate limiting som fallback når Upstash ikke er konfigurert (src/app/api/contact/route.ts:25).
- GDPR-compliant e-post: sanitizeEmail maskerer nå også domene, viser "u***@e***.com" i stedet for "u***@example.com" (src/lib/audit-log.ts:12).
- Utvidet GDPR-sletting: gdpr_hard_delete_user sletter nå også fra gdpr_requests-tabellen og har forbedret sletterekkefølge (supabase/sql/consolidated/07_gdpr.sql:283).
- Instruks-API: /api/instructions validerer nå at alle teamIds tilhører brukerens org for å hindre cross-tenant lenking (src/app/api/instructions/route.ts:72).


Bekreftede funn (med evidens + tiltak)
- Critical RLS: instruction_chunks har FOR ALL uten WITH CHECK, som åpner for innsetting/oppdatering uten org/team‑validering; evidence supabase/sql/consolidated/09_instruction_chunks.sql:45. Remediation: splitt policy per operasjon og legg WITH CHECK på insert/update som verifiserer instruksens org/team; legg RLS‑tester for cross‑tenant.
- Critical match_instructions og match_chunks_hybrid er SECURITY DEFINER og stoler på p_user_id uten å verifisere auth.uid(), som muliggjør spoofing og cross‑org‑lesing ved kjent bruker‑id; evidence supabase/sql/consolidated/08_vector_fix.sql:20, supabase/sql/consolidated/09_instruction_chunks.sql:64. Remediation: bind p_user_id til auth.uid() (eller fjern parameteret) og legg eksplisitt team‑filter.
- High RLS for instructions gir alle i org tilgang til alle publiserte instrukser uten team‑filter, selv om instruction_teams finnes; evidence supabase/sql/consolidated/05_policies.sql:176, supabase/sql/consolidated/02_schema.sql:77. Remediation: legg join til instruction_teams (og ev. org‑wide kun når ingen teams er knyttet).
- Medium Soft‑delete håndheves ikke i RLS eller admin‑spørringer; deleted_at finnes, men policies og admin‑queries filtrerer ikke; evidence supabase/sql/consolidated/12_soft_delete.sql:14, supabase/sql/consolidated/05_policies.sql:176, src/app/(platform)/instructions/admin/page.tsx:50. Remediation: legg deleted_at IS NULL i RLS og filtrer i server‑queries.
- High gdpr_hard_delete_user sletter ikke alle relasjoner og krever manuell auth.users‑sletting; evidence supabase/sql/consolidated/07_gdpr.sql:285, supabase/sql/consolidated/07_gdpr.sql:319. Remediation: utvid sletteliste (instruction_teams, instruction_chunks, invites, alert_teams m.m.) og automatiser auth‑sletting via admin API.
- Medium Audit‑logg sanitisering masker bare lokal del av e‑post; domenet beholdes; evidence src/lib/audit-log.ts:12. Remediation: hash e‑post eller maskér domenet og utvid PII‑feltlisten.
- [x] High CI kjører ikke migrasjons/RLS‑tester; evidence .github/workflows/ci.yml:33. Remediation: FIKSET (Added .github/workflows/rls-test.yml with pgvector integration tests).

Docx‑påstander ikke bekreftet i repo
- Klientside rolle‑sjekk for admin/leader: rolle‑sjekk skjer server‑side før render; evidence src/app/(platform)/instructions/admin/page.tsx:12, src/app/(platform)/instructions/leader/page.tsx:7.
- Manglende audit‑logg UI: admin‑dashboard inkluderer AuditLogTab og hook for visning; evidence src/app/(platform)/instructions/admin/AdminDashboard.tsx:18, src/app/(platform)/instructions/admin/hooks/useAuditLogs.ts:30.
- Ingen overvåking: Sentry er konfigurert og global error rapporterer; evidence src/instrumentation.ts:1, sentry.server.config.ts:11, src/app/global-error.tsx:8.
- Svake storage‑regler: policy krever org‑prefix og blokkerer klient‑skriving; evidence supabase/sql/consolidated/06_storage.sql:45, supabase/sql/consolidated/06_storage.sql:63.

Nye funn utover docx
- Manglende auth.uid()‑binding i match_instructions/match_chunks_hybrid (p_user_id‑spoofing) er ikke omtalt i docx; evidence supabase/sql/consolidated/08_vector_fix.sql:24, supabase/sql/consolidated/09_instruction_chunks.sql:68.

Multi‑tenant & RLS‑gate
- RLS aktivert for tenant‑tabeller: organizations, teams, profiles, folders, instructions, instruction_teams, instruction_reads, alerts, alert_teams, invites, audit_logs, ask_tetra_logs, ai_unanswered_questions, gdpr_retention_runs (supabase/sql/consolidated/02_schema.sql:190), gdpr_requests (supabase/sql/consolidated/11_gdpr_requests.sql:41), instruction_chunks (supabase/sql/consolidated/09_instruction_chunks.sql:29).
- Permissiv policy: instruction_chunks har FOR ALL uten WITH CHECK (supabase/sql/consolidated/09_instruction_chunks.sql:45).
- SECURITY DEFINER‑sjekk: alle inspiserte funksjoner setter search_path, men match_instructions/match_chunks_hybrid mangler auth.uid()‑binding; øvrige funksjoner har auth/rolle‑sjekk (supabase/sql/consolidated/03_functions.sql:13, supabase/sql/consolidated/07_gdpr.sql:150, supabase/sql/consolidated/09_read_confirmations_rpc.sql:5, supabase/sql/consolidated/11_gdpr_requests.sql:97, supabase/sql/consolidated/04_triggers.sql:12).

GDPR‑hardening (minst 10 repo‑tilknyttede tiltak)
- Legg WITH CHECK og team/org‑validering på chunk‑policyen (supabase/sql/consolidated/09_instruction_chunks.sql:45).
- Bind p_user_id til auth.uid() eller fjern parameteret i søkefunksjoner (supabase/sql/consolidated/08_vector_fix.sql:20, supabase/sql/consolidated/09_instruction_chunks.sql:64).
- Team‑filter i instructions RLS med instruction_teams (supabase/sql/consolidated/05_policies.sql:176, supabase/sql/consolidated/02_schema.sql:77).
- Håndhev deleted_at IS NULL i RLS og admin‑queries (supabase/sql/consolidated/05_policies.sql:176, src/app/(platform)/instructions/admin/page.tsx:50).
- Utvid gdpr_hard_delete_user til relasjoner og join‑tabeller (supabase/sql/consolidated/07_gdpr.sql:285).
- Automatiser auth.users‑sletting via backend‑route/admin API (supabase/sql/consolidated/07_gdpr.sql:409).
- Loggfør cleanup‑kjøringer til gdpr_retention_runs (tabell finnes, men brukes ikke i cleanup‑funksjonene) (supabase/sql/consolidated/02_schema.sql:172, supabase/sql/consolidated/07_gdpr.sql:117).
- Stram inn PII‑maskering i audit‑logger (src/lib/audit-log.ts:12).
- Legg GDPR‑tester (export, delete, request) og kjør i CI (src/app/api/gdpr-export/route.ts:10, supabase/sql/consolidated/11_gdpr_requests.sql:97, .github/workflows/ci.yml:33).
- Legg varsling ved cleanup‑feil i GitHub Actions (.github/workflows/gdpr-cleanup.yml:14).

Reviewed
- docs/Audit codebase thoroughly.docx (lesing via docx‑tekstuttrekk)
- supabase/sql/consolidated/02_schema.sql
- supabase/sql/consolidated/05_policies.sql
- supabase/sql/consolidated/06_storage.sql
- supabase/sql/consolidated/07_gdpr.sql
- supabase/sql/consolidated/08_vector_fix.sql
- supabase/sql/consolidated/09_instruction_chunks.sql
- supabase/sql/consolidated/09_read_confirmations_rpc.sql
- supabase/sql/consolidated/11_gdpr_requests.sql
- supabase/sql/consolidated/12_soft_delete.sql
- src/app/(platform)/instructions/admin/page.tsx
- src/app/(platform)/instructions/leader/page.tsx
- src/app/(platform)/instructions/admin/AdminDashboard.tsx
- src/app/(platform)/instructions/admin/hooks/useAuditLogs.ts
- src/app/(platform)/instructions/admin/hooks/useAdminInstructions.ts
- src/app/api/gdpr-cleanup/route.ts
- src/app/api/gdpr-export/route.ts
- src/app/api/audit/route.ts
- src/app/api/audit-logs/route.ts
- src/app/api/invite/route.ts
- src/app/api/upload/route.ts
- src/app/api/health/route.ts
- src/lib/audit-log.ts
- src/lib/ratelimit.ts
- src/lib/sanitize-html.ts
- src/lib/supabase/server.ts
- src/lib/supabase/client.ts
- src/middleware.ts
- .github/workflows/ci.yml
- .github/workflows/security.yml
- .github/workflows/gdpr-cleanup.yml
- src/instrumentation.ts
- sentry.server.config.ts
- sentry.client.config.ts

Not Reviewed
- src/app/(platform)/instructions/** utenom admin/leader (ikke gjennomgått i denne runden)
- src/app/api/** øvrige endepunkter (ikke gjennomgått i denne runden)
- tests/** utover enkel skanning (ikke gjennomgått i denne runden)
- supabase/sql/consolidated/* utenfor listede filer (ikke gjennomgått i denne runden)

Mulige neste steg:
1) Dypdykk i alle API‑endepunkter for authz/tenant‑sjekker og rate‑limits.
2) Lage en konkret RLS‑testplan (pgTAP/custom) og kjøre den mot alle tenant‑tabeller.

API‑dypdykk (steg 1) - STATUS: ✅ ALLE KRITISKE/HIGH PUNKTER FIKSET
- [x] Critical: /api/ask eksponerer match_chunks_hybrid/match_instructions uten auth.uid()‑binding; FIKSET via SQL RPC update (sjekker auth.uid).
- [x] High: /api/read-confirmations kaller RPCer som kun er GRANTet til service_role; FIKSET via service-role client.
- [x] High: /api/instructions linker instruction_teams uten å validere at teamIds tilhører org; FIKSET via API-validering av teams.
- [x] Medium: /api/confirm-read bruker org_id fra get_user_instructions‑RPC; FIKSET via profile oppslag.
- [x] Medium: /api/contact mangler rate‑limit fallback; FIKSET via in-memory fallback.

API‑ruter gjennomgått
- src/app/api/ask/route.ts
- src/app/api/audit/route.ts
- src/app/api/audit-logs/route.ts
- src/app/api/confirm-read/route.ts
- src/app/api/contact/route.ts
- src/app/api/gdpr-cleanup/route.ts
- src/app/api/gdpr-export/route.ts
- src/app/api/gdpr-request/route.ts
- src/app/api/health/route.ts
- src/app/api/instructions/route.ts
- src/app/api/invite/route.ts
- src/app/api/read-confirmations/route.ts
- src/app/api/upload/route.ts

RLS‑testplan (steg 2)
- Testgrunnlag: tabeller og policies fra supabase/sql/consolidated/02_schema.sql, supabase/sql/consolidated/05_policies.sql, supabase/sql/consolidated/09_instruction_chunks.sql, supabase/sql/consolidated/11_gdpr_requests.sql, supabase/sql/consolidated/06_storage.sql.
- Testoppsett: opprett to orgs, to teams per org, og brukere per rolle (admin/teamleader/employee); simuler auth.uid() via request.jwt.claims i test‑SQL; kjør som authenticated‑rolle for å verifisere RLS.
- Org‑isolasjon (alle tenant‑tabeller): verifiser at SELECT/UPDATE/DELETE ikke kan lese/endre rader med org_id fra annen org (organizations, teams, profiles, folders, instructions, instruction_reads, instruction_chunks, alerts, invites, audit_logs, ask_tetra_logs, ai_unanswered_questions, gdpr_requests, gdpr_retention_runs).
- Team‑isolasjon: verifiser at instruction_teams og alert_teams kun kan knytte team fra samme org til instruction/alert (krever policy‑oppdatering); verifiser at get_user_instructions og get_user_alerts returnerer kun team‑tilknyttet innhold (supabase/sql/consolidated/03_functions.sql:59).
- Soft‑delete: verifiser at deleted_at‑satte rader ikke kan leses (instructions/alerts/folders) etter policy‑endringer (supabase/sql/consolidated/12_soft_delete.sql:14).
- SECURITY DEFINER‑funksjoner: test at auth.uid() må samsvare med parametere og at org/team‑grenser håndheves i match_instructions/match_chunks_hybrid/get_user_instructions/get_user_alerts/get_read_confirmations/process_gdpr_deletion_request (supabase/sql/consolidated/03_functions.sql:13, supabase/sql/consolidated/07_gdpr.sql:150, supabase/sql/consolidated/08_vector_fix.sql:20, supabase/sql/consolidated/09_instruction_chunks.sql:64, supabase/sql/consolidated/09_read_confirmations_rpc.sql:5, supabase/sql/consolidated/11_gdpr_requests.sql:97).
- Storage policy: verifiser at storage.objects bare tillater SELECT når path‑prefix matcher org_id (supabase/sql/consolidated/06_storage.sql:45).
