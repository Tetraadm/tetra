# Audit v2 (Full Scan) - Tetrivo

**Dato:** 2026-01-28  
**Repo:** `C:\Users\xboxs\Documents\tetrivo`  
**Maal:** Identifisere feil, sårbarheter og farlige funn (kode, konfig, DB/SQL, Edge Functions, avhengigheter).

## Metode / hva som ble gjort

- Statisk gjennomgang av kritiske flater: `src/app/api/*`, `src/middleware.ts`, `next.config.ts`, `src/lib/*`, `supabase/functions/*`, `supabase/sql/consolidated/*`.
- Enkle secrets-sok (mønstre for nøkler/credentials) i repo.
- Kvalitetssjekker (lokalt):
  - `npm run lint` (OK)
  - `npm run typecheck` (OK)
  - `npm test` (OK, 77 tester)
  - `npm run build` (OK)
- Avhengighets-scan:
  - `npm audit --audit-level=low` (1 moderat funn)

## Kritiske funn (maa fikses foer pilot/produksjon)

### C-001 /api/tasks/process kan misbrukes av innloggede brukere (service_role-operasjoner uten autorisasjon)

- **Hva:** `POST /api/tasks/process` bruker `createServiceRoleClient()` og utfoerer endringer (slette/insert chunks, oppdatere embeddings) uten a validere brukerrolle eller at `instructionId` tilhorer brukerens org.
- **Hvorfor det er kritisk:** En vanlig innlogget bruker kan sende spoofede headers og trigge oppgaver mot vilkarlige `instructionId`-er (potensiell cross-tenant tampering / datakorruptjon).
- **Bevis:**
  - `src/app/api/tasks/process/route.ts`
  - `src/lib/cloud-tasks.ts` (auth sjekken baserer seg kun pa tilstedevaerelse av `x-cloudtasks-*` headers)
- **Anbefalt tiltak:**
  1. Fjern hele endepunktet dersom Cloud Tasks ikke brukes lenger (anbefalt, siden async flyt er flyttet til Supabase Edge Functions).
  2. Hvis det maa eksistere: krev sterk auth (f.eks. delt secret + HMAC, eller verifisert OIDC-token fra Cloud Tasks) og legg inn eksplisitt org- og rollekontroll (admin) for alle operasjoner.

### C-002 Supabase Edge Functions er fail-open hvis EDGE_FUNCTION_SECRET ikke er satt

- **Hva:** Alle Edge Functions sjekker `X-Edge-Secret` kun dersom `EDGE_FUNCTION_SECRET` finnes. Hvis secrets ikke er satt i Supabase, blir endepunktene effektive aapne.
- **Hvorfor det er kritisk:** Funksjonene bruker `SUPABASE_SERVICE_ROLE_KEY` internt og kan oppdatere databasen, laste ned fra GCS, trigge import til Discovery Engine, osv. Feilkonfig i secrets kan bli en full kompromittering.
- **Bevis:**
  - `supabase/functions/generate-embeddings/index.ts`
  - `supabase/functions/process-document/index.ts`
  - `supabase/functions/gemini-chat/index.ts`
  - `supabase/functions/vertex-search/index.ts`
  - `supabase/functions/vertex-admin/index.ts`
- **Anbefalt tiltak:**
  1. Fail-hard ved oppstart/foresporsel hvis `EDGE_FUNCTION_SECRET` mangler (returner 503/500 og logg tydelig).
  2. Deploy Edge Functions med JWT-verifisering aktiv (Supabase `verify_jwt=true`) og/eller valider at Authorization er service_role (ikke anon).
  3. Stram inn CORS (ikke `*`) dersom funksjonene kun er interne.

## Hoy risiko

### H-001 Avhengighet: Next.js DoS-advisory

- **Hva:** `npm audit` rapporterer 1 moderat sårbarhet i `next` (DoS via Image Optimizer remotePatterns).
- **Bevis:** `npm audit --audit-level=low` -> GHSA-9g9p-9gw9-jx7f
- **Anbefalt tiltak:** Oppdater `next` til en versjon med fix (minst `16.1.4` eller nyere som inneholder patchen) og kjør `npm audit fix` / oppdater lockfile kontrollert.

## Medium

### M-001 Debug-logging i produksjonskode (potensiell data-/metadata-lekkasje)

- **Hva:** Flere `console.log`/`console.warn` i API-ruter logger interne detaljer (f.eks. Vertex-match, filstier, UUIDer, kontekstlengde).
- **Bevis:** `src/app/api/ask/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- **Risiko:** Logger kan inneholde personopplysninger, dokumentmetadata og interne ID-er; oeker blast radius ved kompromitterte logger.
- **Anbefalt tiltak:** Bruk strukturert logger med nivaa (info/warn/error) og maskering; gate debug til `NODE_ENV !== 'production'`.

### M-002 Farlige standardverdier kan peke mot produksjon

- **Hva:** Prosjektet har defaults som kan peke mot prod (bucket/prosjekt-id) hvis env mangler.
- **Bevis:**
  - `src/lib/vertex-auth.ts` (fallback `tetrivo-production`)
  - `src/app/api/upload/route.ts` (fallback bucket `tetrivo-documents-eu`)
  - `src/app/api/gdpr-cleanup/route.ts` (fallback bucket)
- **Risiko:** Utilsiktet prod-skriving fra dev/staging.
- **Anbefalt tiltak:** Fail-fast hvis kritiske env vars mangler; krev eksplisitt `GOOGLE_CLOUD_PROJECT`/bucket per miljo.

### M-003 /api/contact rate-limit fallback er svak i serverless

- **Hva:** Ved manglende Upstash brukes in-memory rate-limit.
- **Bevis:** `src/app/api/contact/route.ts`
- **Risiko:** I serverless kan instanser restartes ofte -> rate-limit kan omgaas; spam/misbruk.
- **Anbefalt tiltak:** Krev Upstash i prod (fail-closed), eller flytt rate-limit til en delt datastore.

### M-004 CSP tillater unsafe-inline

- **Hva:** CSP inkluderer `'unsafe-inline'` for `script-src` og `style-src`.
- **Bevis:** `next.config.ts`
- **Risiko:** Oker skade ved XSS.
- **Anbefalt tiltak:** Innfor nonce-basert CSP (Next `cspNonce`) og fjern `unsafe-inline`.

### M-005 Instruks-opprettelse kan bli inkonsistent hvis team-linking feiler

- **Hva:** I JSON-baserte create/update routes er team-linking feilhandtering ikke rollback/soft-delete pa samme maate som upload-ruten.
- **Bevis:** `src/app/api/instructions/route.ts`
- **Risiko:** Kan gi "ghost"-instrukser (synlighet avhenger av RLS/team-tilknytning) og mer manuell opprydding.
- **Anbefalt tiltak:** Bruk transaksjon (RPC) eller soft-delete/rollback ved team-link-feil (samme pattern som `src/app/api/upload/route.ts`).

## Lav risiko / hygiene

### L-001 Lokalt service account key finnes i workspace (gitignored)

- **Hva:** Filen `tetrivo-eu-1fc4af79d2a6.json` inneholder privat nøkkel (GCP service account) men er ignorert av git.
- **Bevis:** `.gitignore` matcher `tetrivo-eu-*.json`.
- **Risiko:** Kan lekke ved deling av mappe/backup; høy konsekvens hvis nøkkelen er aktiv.
- **Anbefalt tiltak:** Flytt til trygg secrets manager / kun env (`GOOGLE_CREDENTIALS_JSON`). Roter nøkkelen hvis den kan ha blitt delt.

### L-002 Next.js warning: middleware-konvensjon deprecated

- **Hva:** Build logger advarsel om at `middleware`-konvensjonen er deprecated.
- **Bevis:** `npm run build` output.
- **Risiko:** Ikke sikkerhet i seg selv, men kan bli brudd ved fremtidige Next-oppgraderinger.
- **Anbefalt tiltak:** Folg Next sin anbefalte migrasjon til `proxy`-oppsett.

## Positive observasjoner

- RLS og policies ser gjennomarbeidet ut (`supabase/sql/consolidated/05_policies.sql`, `supabase/sql/consolidated/06_storage.sql`).
- De fleste API-ruter validerer input (Zod) og sjekker rolle/org for admin-operasjoner.
- `src/lib/supabase/server.ts` er `server-only`, som reduserer risiko for lekkasje av service role.

## Konkrete neste steg (prioritert)

1. Fiks C-001: fjern eller harden `src/app/api/tasks/process/route.ts` + styrk `src/lib/cloud-tasks.ts` (ikke stol pa spoofbare headers).
2. Fiks C-002: krev `EDGE_FUNCTION_SECRET` og fail-hard i alle `supabase/functions/*`.
3. Oppdater `next` til patched versjon (H-001) og re-run `npm audit`.
4. Reduser produksjonslogging og fjern/guard debug logs (M-001).
5. Fjern prod-defaults (M-002) og krev eksplisitt konfig i alle miljo.
