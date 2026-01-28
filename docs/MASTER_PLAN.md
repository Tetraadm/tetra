# Tetrivo – Masterplan (Kritisk → Høy → Medium → Lav)

**Dato:** 2026-01-28  
**Mål:** Én arbeidsliste du kan jobbe deg nedover, med kun relevante punkter per i dag.

## Hva som er verifisert (ikke lenger i "må fikses")

- Cloud Tasks-endepunkt fjernet: `src/app/api/tasks/process/route.ts` (slettet) og `src/lib/cloud-tasks.ts` (slettet)
- Edge Functions fail-hard på manglende `EDGE_FUNCTION_SECRET` (503)
- `GCS_BUCKET_NAME`/`GOOGLE_CLOUD_PROJECT` prod-defaults fjernet i Next.js API-ruter (fail-hard)
- `GCS_BUCKET_NAME` fail-hard i Edge Functions (`process-document`, `vertex-admin`) – returnerer 503 hvis ikke konfigurert
- Tekst-instrukser chunkes og embeddes ved opprettelse: `src/app/api/instructions/route.ts`
- Edit/re-index (delete + re-insert chunks) ved oppdatering: `src/app/api/instructions/[id]/route.ts`
- Read-confirmations RPC er kompatibel med service_role (auth.uid()-sjekker fjernet): `supabase/sql/consolidated/09_read_confirmations_rpc.sql`
- PII masking i `ai_unanswered_questions`: `src/app/api/ask/route.ts` bruker `maskPII()`
- `npm audit` viser 0 vulnerabilities (men se "Lav: versjonskonsistens")
- **RLS-ytelsesoptimalisering (2026-01-28):**
  - Alle `auth.uid()` kall bruker subquery-mønster: `(SELECT auth.uid())`
  - `ALL` policies splittet til separate `INSERT/UPDATE/DELETE` for å unngå overlapp
  - Dupliserte SELECT-policies konsolidert (60 → 0 `multiple_permissive_policies` warnings)
  - SQL-filer synkronisert: `05_policies.sql`, `09_instruction_chunks.sql`, `11_gdpr_requests.sql`

## Kritisk (0)

- Ingen nye kritiske funn identifisert i dagens scan.

## Høy

### H-01 ~~Vertex Search (Discovery Engine) – risiko for tenant-miks ved feil aktivering~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** `supabase/functions/vertex-search/index.ts` har post-filtering på orgId
- **Gjort:** Implementert org-filtrering via:
  - `vertex-export` Edge Function eksporterer instrukser til JSONL med orgId i URI
  - `vertex-search` krever orgId og filtrerer resultater basert på URI-path
  - `ENABLE_VERTEX_SEARCH=false` som default til verifisert

### H-02 ~~Lokalt GCP service account key i repo-mappen~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** `tetrivo-eu-1fc4af79d2a6.json` var gitignored, nå slettet fra repo-mappen
- **Gjort:** Fil slettet, nøkkel lagret sikkert utenfor repo

### H-03 Operasjonelt (pilot/ISO): tilgang og leverandører

- **Status:** Må verifiseres / gjøres
- **Gjør (minimum før pilot):**
  - MFA for admin i Supabase (policy)
  - Backups/PITR: verifiser at dere har restore-prosedyre (test en restore i et ikke-prod miljø)
  - Subprosessorliste + DPA-status: oppdater til faktisk stack (Google/Supabase/Vercel/Sentry/Upstash/Resend)

## Medium

### M-01 CSP: `unsafe-inline`

- **Status:** Åpen
- **Bevis:** `next.config.ts`
- **Gjør:** Innfør nonce-basert CSP og fjern `unsafe-inline` (script/style)

### M-02 Debug/console logging i prod-kode

- **Status:** Åpen
- **Bevis:** `src/app/api/ask/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- **Gjør:** Bytt til strukturert logging (pino) + nivåstyring, eller gate debug til `NODE_ENV !== 'production'`

### M-03 PDF parsing: kun total-timeout (ingen per-side abort)

- **Status:** Åpen
- **Bevis:** `src/app/api/upload/route.ts` (PDF_TIMEOUT_MS)
- **Gjør:** Legg inn per-side abort (eller strengere parsinggrenser) + god feilmelding til bruker

### M-04 Team-kobling: mangler rollback/soft-delete ved feil

- **Status:** Åpen
- **Bevis:** `src/app/api/instructions/route.ts` (TEAM_LINK_ERROR kommenterer at soft-delete er “safer”, men gjør det ikke)
- **Gjør:** Bruk transaksjon/RPC eller soft-delete instruks ved team-link-feil

### M-05 Edge Functions CORS: `Access-Control-Allow-Origin: *`

- **Status:** Åpen
- **Bevis:** `supabase/functions/*/index.ts`
- **Gjør:** Stram inn CORS til forventede origins, eller fjern CORS hvis kun server-til-server

### M-06 Team-admin UI: menypunkter uten handling

- **Status:** Åpen
- **Bevis:** `src/app/(platform)/instructions/admin/tabs/TeamsTab.tsx` ("Rediger"/"Administrer medlemmer" uten onClick)
- **Gjør:** Implementer teamredigering og medlemsadministrasjon (eller fjern/disable menypunktene)

### M-07 ~~Dokumentasjon/konfig: utdaterte Anthropic-referanser i runtime~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:**
  - `src/app/api/health/route.ts` - fjernet ANTHROPIC_API_KEY sjekk
  - `next.config.ts` CSP - fjernet `https://api.anthropic.com` fra connect-src
- **Gjort:** Anthropic fjernet fra health-check og CSP

## Lav

### L-01 ~~Invite e-post: ingen HTML-escaping for `inviterName`/`role`~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** `src/lib/emails/invite-email.ts` - lagt til `escapeHtml()` funksjon
- **Gjort:** HTML-escape på inviterName og role for XSS-beskyttelse

### L-02 Audit logging: “client”-wrapper brukes fortsatt i hooks

- **Status:** Åpen (lav risiko)
- **Bevis:** `src/lib/audit-log.ts`, hooks i `src/app/(platform)/instructions/admin/hooks/*`
- **Gjør:** Bytt hooks til `logAuditEvent()` direkte; fjern `logAuditEventClient` senere

### L-03 ~~Next.js dependency range er eldre enn installert versjon~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** `package.json` - oppdatert til `next: ^16.1.6`
- **Gjort:** Versjon synkronisert med installert versjon

### L-04 Bygg-warnings

- **Status:** Åpen
- **Bevis:** `npm run build` (deprecated middleware-konvensjon + MODULE_TYPELESS)
- **Gjør:** Migrer fra `middleware` til `proxy`, og vurder `"type": "module"` eller juster `tailwind.config.ts`

### L-05 ~~Utdatert dokumentasjon om AI-stack/underleverandører~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** Oppdatert filer:
  - `README.md` - fjernet Claude-referanser
  - `docs/HVORDAN_TETRIVO_FUNGERER.md` - oppdatert til Vertex AI/Gemini
  - `docs/SECURITY_SUMMARY.md` - oppdatert arkitekturdiagram
  - `docs/SUBPROCESSORS.md` - erstattet Anthropic/OpenAI med Google Cloud
- **Gjort:** All dokumentasjon reflekterer nå Gemini/Vertex AI stack

### L-06 ~~OpenAI-avhengighet brukes kun i script~~ ✅

- **Status:** Løst (2026-01-28)
- **Bevis:** `package.json` - `openai` flyttet til devDependencies
- **Gjort:** OpenAI er nå kun tilgjengelig for scripts, ikke i produksjon

## Må verifiseres i pilot

- Invitasjonsflyt på mobil: Radix Select (team/rolle)
- Opprett instruks/kunnngjøring på mobil (modals/select)
- Kunngjøringer: toggle/deaktiver/reaktiver end-to-end
