# Tetra logg (kort)

## 2026-01-13
- /api/ask krever innlogget bruker; org/user hentes fra profile (ignorerer klient-supplert orgId/userId). Bruker alltid RPC get_user_instructions; returnerer updated_at hvis tilgjengelig. Logger RLS-feil på inserts.
- RLS: instruction_reads insert/update krever at instruksjonen tilhører samme org som brukeren; sjekker instruction_id->instructions.org_id. Migrasjon kjørt i Supabase.
- RPC accept_invite gjenopprettet: valid token <7d, krever session, upserter profile med rolle/org/team, markerer invite brukt. Migrasjon kjørt i Supabase.
- /api/upload: PDF-tekst trekkes ut automatisk (pdf-parse). effectiveContent fylles fra PDF hvis content er tom. npm install kjørt, package-lock oppdatert.
- AdminDashboard-logikk flyttet ut i hooks (brukere/team/instrukser/avvik/auditlogg/leserapport); tabs under src/app/admin/tabs brukes videre fra parent.
- AdminDashboard.tsx redusert fra ~1500 til ~530 linjer; 9 tab-komponenter: OverviewTab, UsersTab, TeamsTab, InstructionsTab, AlertsTab, AiLogTab, InsightsTab, AuditLogTab, ReadConfirmationsTab. Parent beholder all state/modaler/handlere og sender props.
- EmployeeApp: chat/instruks/modaldetaljer flyttet til hooks under src/app/employee/hooks; layout/tabber beholdt.
- Viktig: Hook-refaktor for admin/employee er i main; modaler/tabber beholdt i parent. claude-tetra.md er fortsatt lokalt endret (ikke committed).

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