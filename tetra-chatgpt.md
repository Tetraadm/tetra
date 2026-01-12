# Tetra logg (kort)

## 2026-01-12 (latest)
- Rate limiting: Upstash Redis wrapper + safe env parsing; defaults now AI 20/60s, upload 10/60s; prod warns if Upstash missing.
- Employee chat: shows explicit 429 message from API; notfound bubble displays custom message when present.
- UI icons: replaced emoji/glyphs with lucide-react across admin/leader/invite/error/offline; EmptyState now accepts ReactNode icon.
- README: env defaults updated; AI_MIN_RELEVANCE_SCORE default set to 0.35.

## 2026-01-15
- Supabase: 14_rls_optimization applied; new migrations 15_policy_consolidation, 16_drop_unused_indexes, 17_add_fk_indexes applied.
- RLS policies consolidated; admin manage policies split into insert/update/delete to remove multiple permissive policy warnings.
- Dropped non-FK indexes (instructions keywords/severity/file_path); kept FK indexes to avoid unindexed FK warnings.
- Advisors: security still shows leaked password protection disabled; performance now only unused index warnings for FK indexes (expected on low traffic).
- SQL files 15-17 added under supabase/sql; codex-handoff updated with DB state and advisors.
- Pending: consider enabling leaked password protection; consider restricting my_org_id grant to authenticated.

## 2026-01-14
- Docs opprydding: README.md versjon (Next.js 15 → 16), ai-qa-test.md typo (epplekake → eplekake).
- claude-tetra.md: oppdatert SQL-filliste (09-14), neste fil er nå 15.
- Fjernet tom src/components/ui mappe.
- Build verifisert grønn.

## 2026-01-13
- /api/ask krever innlogget bruker; org/user hentes fra profile (ignorerer klient-supplert orgId/userId). Bruker alltid RPC get_user_instructions; returnerer updated_at hvis tilgjengelig. Logger RLS-feil på inserts.
- RLS: instruction_reads insert/update krever at instruksjonen tilhører samme org som brukeren; sjekker instruction_id->instructions.org_id. Migrasjon kjørt i Supabase.
- RPC accept_invite gjenopprettet: valid token <7d, krever session, upserter profile med rolle/org/team, markerer invite brukt. Migrasjon kjørt i Supabase.
- /api/upload: PDF-tekst trekkes ut automatisk (pdf-parse). effectiveContent fylles fra PDF hvis content er tom. npm install kjørt, package-lock oppdatert.
- AdminDashboard-logikk flyttet ut i hooks (brukere/team/instrukser/avvik/auditlogg/leserapport); tabs under src/app/admin/tabs brukes videre fra parent.
- AdminDashboard.tsx redusert fra ~1500 til ~530 linjer; 9 tab-komponenter: OverviewTab, UsersTab, TeamsTab, InstructionsTab, AlertsTab, AiLogTab, InsightsTab, AuditLogTab, ReadConfirmationsTab. Parent beholder all state/modaler/handlere og sender props.
- EmployeeApp: chat/instruks/modaldetaljer flyttet til hooks under src/app/employee/hooks; layout/tabber beholdt.
- Viktig: Hook-refaktor for admin/employee er i main; modaler/tabber beholdt i parent. claude-tetra.md er fortsatt lokalt endret (ikke committed).
- Admin-modaler: ModalShell fikk dialog-rolle/ARIA, Escape-lukking, fokus-trap og auto-fokus; ryddet tekst i admin-modaler.
- Supabase/sql: ryddet migrasjonsnummer (11_rpc_add_updated_at, 13_db_advisor_fixes) for å unngå duplikat 10_.
- Supabase: migrasjon 13_db_advisor_fixes kjørt (search_path for set_updated_at + manglende FK-indekser).
- claude-tetra.md: modal-tilgjengelighet markert som fikset.
- RLS: ny migrasjon `supabase/sql/14_rls_optimization.sql` med my_org_id + auth.uid initplan-optimalisering og forenklede admin-policyer (ikke kjørt; Supabase-auth mangler i MCP).

## 2026-01-12
- Streng AI i /api/ask: svar kun fra instrukser for riktig org, fallback-tekst: "Jeg finner ingen relevant instruks i Tetra for dette. Kontakt din leder eller sikkerhetsansvarlig."
- Relevansfilter: keyword overlap + score threshold; source-metadata i responsen (instruction_id, title, updated_at, open_url_or_route).
- Ny tabell: public.ai_unanswered_questions + RLS; instructions.updated_at med trigger; RPC get_user_instructions returnerer updated_at. Migrasjonsrekkefølge ryddet.

## 2026-01-11
- Ryddet norsk UI-tekst i login/admin/employee; fikset korrupt tekst i auth-callback/post-auth.
- Fjernet ubrukte UI-komponenter i src/components/ui/.
- Grønn build verifisert med npm run build.
- Admin: modaler flyttet til src/app/admin/components/modals.tsx; AdminDashboard bruker nye komponenter; EditUserModal tar nå teams, og hooks-typene NewInstructionState/NewAlertState er eksportert.
- Ryddet encoding-artefakter i admin-tabber og modaler (spørsmål/nødutgang/støtteverktøy m.m.), pluss små tekstjusteringer i Alerts/Instructions.
- AdminDashboard fikk manglende </div>-lukking etter modal-uttak; npm run build kjørte grønt.
## 2026-01-10
- Synket supabase/sql/01_schema.sql med live DB; ryddet kanoniske RLS-policyer; storage-policy for instructions-bucket til org-lesing.
- Profiles: get_profile_context for å unngå RLS-recursion; la til profiles.email + trigger set_profile_email.
- /api/ask: trygg folder/severity-tilgang; proxy.ts erstattet middleware deprecation.
- Upload: lagrer content fra admin; keywords fra title+content; auditlogg på create/publish/unpublish.

### Supabase status
- RLS aktiv på alle public-tabeller; storage bucket instructions privat med org-basert lese-policy.
- Etter pdf-parse: `npm install` kjørt, package-lock oppdatert.
