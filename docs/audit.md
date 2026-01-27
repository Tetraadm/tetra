# Tetrivo HMS – Prosjektaudit (Pilot‑klarhet)
**Dato:** 2026-01-27  
**Mål:** Sette prosjektet i en trygg, stabil tilstand for **pilot**, ikke full “enterprise” ferdigvare.  
**Omfang:** Statisk gjennomgang av kode, Supabase SQL, konfig og dokumentasjon.  
**Utelukket:** Ingen runtime‑tester, ingen ekstern sårbarhetsskanning, ingen produksjonsverifikasjon.

---

## Bruk av listen
- Funn er sortert **Critical → High → Medium → Low → Info**.
- **Pilot‑prioritet:** Løs **Critical + High** før pilot. Medium bør tas hvis tid. Low/Info kan planlegges etter pilot.

---

## Critical (0)
Ingen kritiske funn bekreftet i statisk gjennomgang.

---

## High

### H‑001 Åpne Supabase Edge Functions uten tydelig auth
- **Hva:** Deno‑funksjonene aksepterer alle requests og bruker `SUPABASE_SERVICE_ROLE_KEY`. CORS er `*`.
- **Bevis:** `supabase/functions/generate-embeddings/index.ts`, `supabase/functions/process-document/index.ts`
- **Risiko:** Uvedkommende kan trigge ressurskrevende operasjoner, kostnads‑ og DoS‑risiko.
- **Anbefaling:** Sikre `verify_jwt=true` ved deploy **og** legg inn egen auth‑sjekk (token/signatur) i funksjonene. Stram inn CORS.

### H‑002 Cloud Tasks‑endepunkt kan spoofes
- **Hva:** `/api/tasks/process` godkjenner kun at noen Cloud Tasks‑headers eksisterer.
- **Bevis:** `src/lib/cloud-tasks.ts`, `src/app/api/tasks/process/route.ts`
- **Risiko:** Endepunktet kjører med `service_role`. Spoofet request kan trigge tunge prosesser.
- **Anbefaling:** Verifiser signert OIDC‑token fra Cloud Tasks, bruk delt hemmelighet, og/eller IP‑allowlist. Vurder å deaktivere i prod hvis ikke brukt.

### H‑003 Potensiell tenant‑lekkasje i Vertex Search
- **Hva:** `searchDocuments()` støtter `orgId`, men `ask` sender det ikke. Cache blir dermed global.
- **Bevis:** `src/lib/vertex-search.ts`, `src/app/api/ask/route.ts`
- **Risiko:** Kryss‑org datalekkasjer hvis Discovery Engine datasett er multitenant.
- **Anbefaling:** Send `orgId` fra `ask`‑ruten og filtrer i Discovery Engine (serving config/filter).

### H‑004 Minneeksplosjon ved Document AI‑prosessering
- **Hva:** `process-document` base64‑enkoder PDF via `String.fromCharCode(...Uint8Array)`.
- **Bevis:** `supabase/functions/process-document/index.ts`
- **Risiko:** Store PDF‑er kan krasje funksjonen (RangeError / høyt minneforbruk).
- **Anbefaling:** Bruk `Buffer.from(bytes).toString('base64')` eller streaming. Sett maks filstørrelse.

---

## Medium

### M‑001 CSP tillater `unsafe-inline`
- **Hva:** `script-src` og `style-src` inkluderer `unsafe-inline`.
- **Bevis:** `next.config.ts`
- **Risiko:** Øker konsekvensen hvis XSS oppstår.
- **Anbefaling:** Innfør nonce‑basert CSP (Next.js `cspNonce`) og fjern `unsafe-inline`.

### M‑002 Debug‑logging i produksjonskode
- **Hva:** Flere `console.log` i `/api/ask` og PDF‑prosessering kjører uten miljø‑sjekk.
- **Bevis:** `src/app/api/ask/route.ts`, `src/app/api/upload/route.ts`
- **Risiko:** Intern info (UUIDer, filstier, metadata) havner i prod‑logger.
- **Anbefaling:** Flytt til logger med nivå, eller wrap i `NODE_ENV !== 'production'`.

### M‑003 PDF‑parsing har kun global timeout
- **Hva:** Total timeout (20s) uten per‑side abort.
- **Bevis:** `src/app/api/upload/route.ts`
- **Risiko:** Store/komplekse PDF‑er kan bruke hele timeout‑budsjettet og henge.
- **Anbefaling:** Legg til per‑side abort eller strengere parsing‑grenser.

### M‑004 Team‑kobling kan feile uten rollback
- **Hva:** `/api/instructions` logger feil ved team‑kobling, men beholder instruks.
- **Bevis:** `src/app/api/instructions/route.ts`
- **Risiko:** Instruks kan bli synlig org‑wide når teamlink feiler.
- **Anbefaling:** Transaksjon eller soft‑delete ved feil (som i `/api/upload`).

### M‑005 Fallback til prod‑prosjekt/bucket ved manglende env
- **Hva:** Default til `tetrivo-production` og `tetrivo-documents-eu` ved manglende env.
- **Bevis:** `src/lib/vertex-auth.ts`, `src/app/api/upload/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- **Risiko:** Utilsiktet prod‑skriv i staging/dev.
- **Anbefaling:** Fail hardt når kritiske env‑vars mangler.

### M‑006 Kontakt‑rate‑limit fallback er svak i serverless
- **Hva:** In‑memory fallback i `/api/contact` ved manglende Upstash.
- **Bevis:** `src/app/api/contact/route.ts`
- **Risiko:** Spam/misbruk hvis Upstash ikke er satt i prod.
- **Anbefaling:** Påkrevd Upstash i prod, eller fail‑closed.

### M‑007 Fail‑closed rate‑limit kan gi total nedetid ved misconfig
- **Hva:** `MisconfiguredRatelimit` returnerer alltid 503 i prod.
- **Bevis:** `src/lib/ratelimit.ts`
- **Risiko:** En env‑feil kan stoppe alle API‑ruter.
- **Anbefaling:** Bedre observability + eksplisitte “startup checks”.

---

## Low

### L‑001 Deprecated audit‑funksjon er fortsatt tilgjengelig
- **Hva:** `logAuditEventClient` kan fortsatt brukes fra klient.
- **Bevis:** `src/lib/audit-log.ts`
- **Risiko:** Fremtidig misbruk kan gjeninnføre klient‑tamper.
- **Anbefaling:** Fjern eller kast error ved bruk.

### L‑002 Invitasjons‑epost interpolerer tekst uten HTML‑escaping
- **Hva:** `inviterName` og `role` brukes direkte i HTML‑epost.
- **Bevis:** `src/lib/emails/invite-email.ts`
- **Risiko:** Visuell manipulasjon i e‑post (phishing‑risiko).
- **Anbefaling:** Escape/strip HTML før interpolering.

### L‑003 Hardkodede modellnavn
- **Hva:** Gemini‑ og OpenAI‑modellnavn er hardkodet.
- **Bevis:** `src/lib/vertex-chat.ts`, `src/lib/embeddings.ts`
- **Risiko:** Manuell oppdatering ved modellendringer.
- **Anbefaling:** Flytt til env‑vars.

### L‑004 PDF‑metadata logges
- **Hva:** Logger antall sider/tegn.
- **Bevis:** `src/app/api/upload/route.ts`
- **Risiko:** Metadata‑lekkasje til logger.
- **Anbefaling:** Reduser loggnivå/utvid masking.

### L‑005 Intern `.cursorrules` i repo
- **Hva:** Filen ser ut til å være intern agent‑konfig.
- **Bevis:** `.cursorrules`
- **Risiko:** Forvirring og potensiell lekkasje av interne regler.
- **Anbefaling:** Fjern eller flytt til intern dokumentasjon.

### L‑006 Lokale secrets i `.env.local`
- **Hva:** Reelle nøkler lagret lokalt.
- **Bevis:** `.env.local`
- **Risiko:** Lekkasje hvis fil deles.
- **Anbefaling:** Roter nøkler hvis filen har vært delt; aldri commit.

### L‑007 Env‑dokumentasjon kan presiseres
- **Hva:** `NEXT_PUBLIC_SUPABASE_ANON_KEY` er fortsatt sensitiv, men docs er ikke tydelige.
- **Bevis:** `.env.example`, `README.md`
- **Risiko:** Utilsiktet deling av nøkler.
- **Anbefaling:** Legg inn tydelig advarsel (gitignore dekker allerede `.env*`).

---

## Info / trenger verifisering

### I‑001 UI‑bugs i improvement‑plan
- **Hva:** `docs/IMPROVEMENT_PLAN.md` har en liste med UI‑bugs (noe er markert ✅).
- **Bevis:** `docs/IMPROVEMENT_PLAN.md`
- **Risiko:** Uklar status for pilot. Krever verifikasjon i UI.
- **Anbefaling:** Verifiser i pilot‑test; prioriter mobile Radix‑select issues.

### I‑002 Sentry‑konfig i prod
- **Hva:** Sørg for at `NEXT_PUBLIC_SENTRY_DSN` og `SENTRY_PROJECT` er satt i prod.
- **Bevis:** `next.config.ts`, `.env.example`
- **Anbefaling:** Verifiser i deploy‑miljø.

### I‑003 Ubrukte dependencies (påstand ikke bekreftet)
- **Hva:** Pro‑audit nevnte ubrukte `@google-cloud/*`, men de brukes i koden.
- **Bevis:** `src/lib/vertex-search.ts`, `src/lib/vertex-chat.ts`
- **Status:** Ikke funn – beholdes her som “avkreftet”.

---

## Dokumentasjonsavvik

### README.md
- **AI‑stack:** README sier Claude/Anthropic, mens kode bruker Gemini (Vertex) + OpenAI embeddings.  
  **Bevis:** `README.md`, `src/lib/vertex-chat.ts`, `src/lib/embeddings.ts`
- **API‑liste:** Mangler `/api/gdpr-export`, `/api/instructions`, `/api/confirm-read`.  
  `/api/read-confirmations` er GET, ikke POST.  
  **Bevis:** `README.md`, `src/app/api/*`
- **Health:** README sier “Vertex sjekk”; `/api/health` sjekker kun config‑tilstedeværelse.  
  **Bevis:** `README.md`, `src/app/api/health/route.ts`
- **GitHub Actions:** README nevner `ci.yml` og `security.yml`, men de finnes ikke.  
  **Bevis:** `README.md`, `.github/workflows`
- **Prosjektstruktur:** `deviations/` vises, men finnes ikke.  
  **Bevis:** `README.md`, `src/app/(platform)`
- **Edge Functions:** README nevner kun `generate-embeddings`, men `process-document` finnes.  
  **Bevis:** `README.md`, `supabase/functions`

### RUNBOOK.md
- **PDF timeout:** Runbook sier 30s, kode bruker 20s.  
  **Bevis:** `RUNBOOK.md`, `src/app/api/upload/route.ts`
- **Tasks varighet:** Runbook sier 60s; `maxDuration` er 300s.  
  **Bevis:** `RUNBOOK.md`, `src/app/api/tasks/process/route.ts`
- **Health‑respons:** Runbook viser felter som ikke returneres.  
  **Bevis:** `RUNBOOK.md`, `src/app/api/health/route.ts`
- **AI‑tjenester:** Runbook omtaler Anthropic, men koden bruker Gemini + OpenAI.  
  **Bevis:** `RUNBOOK.md`, `src/lib/vertex-chat.ts`, `src/lib/embeddings.ts`
- **GDPR cleanup:** Runbook nevner ikke GCS‑opprydding eller `ai_unanswered_questions`.  
  **Bevis:** `RUNBOOK.md`, `src/app/api/gdpr-cleanup/route.ts`, `supabase/sql/consolidated/07_gdpr.sql`

### docs/opus.md (sesjonsnotat)
- **Edge payload‑format:** Dokumentet beskriver payload som ikke matcher funksjons‑signaturer.  
  **Bevis:** `docs/opus.md`, `supabase/functions/*`
- **Document AI‑flyt:** Beskrevet “storagePath/processorId” er ikke i aktiv funksjonssignatur.  
  **Bevis:** `docs/opus.md`, `supabase/functions/process-document/index.ts`

---

## Pilot‑anbefaling (kort)
**Må fikses før pilot:** H‑001, H‑002, H‑003, H‑004.  
**Bør fikses før pilot hvis tid:** M‑001 til M‑004.  
**Kan utsettes:** Low/Info, men dokumentasjonsavvik bør ryddes før eksterne brukere.

