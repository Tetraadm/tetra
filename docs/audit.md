# Tetrivo HMS – Prosjektaudit
**Dato:** 2026-01-27  
**Omfang:** Statisk gjennomgang av kildekode, Supabase SQL, konfig og dokumentasjon.  
**Utelukket:** Ingen kjøring av app/tester, ingen ekstern sårbarhetsskanning eller produksjonsverifikasjon.

---

## Sammendrag (kort)
**Høy risiko:** 3 funn  
**Medium:** 5 funn  
**Lav:** 2 funn  
**Dokumentasjon:** README og RUNBOOK er delvis utdatert i forhold til faktisk kode.

---

## Høy risiko

### 1) Cloud Tasks‑endepunkt kan spoofes
- **Hva:** `/api/tasks/process` er beskyttet av `verifyCloudTasksRequest`, som kun sjekker at enkelte headere finnes (kan forfalskes).
- **Bevis:** `src/lib/cloud-tasks.ts`, `src/app/api/tasks/process/route.ts`
- **Risiko:** Uvedkommende kan trigge tunge oppgaver som kjører med `service_role` og potensielt påvirke data.
- **Anbefaling:** Bruk signert OIDC‑token fra Cloud Tasks, IP‑allowlist, og/eller krav om delt hemmelighet i header. Vurder å fjerne endepunktet i prod hvis Cloud Tasks ikke er i bruk.

### 2) Edge Functions uten eksplisitt auth i funksjonskode
- **Hva:** Deno‑funksjoner aksepterer alle requests og bruker `SUPABASE_SERVICE_ROLE_KEY`. CORS tillater `*`.
- **Bevis:** `supabase/functions/generate-embeddings/index.ts`, `supabase/functions/process-document/index.ts`
- **Risiko:** Hvis deploy er gjort med `verify_jwt=false`, kan endepunktene misbrukes for privilegerte operasjoner.
- **Anbefaling:** Sikre `verify_jwt=true` ved deploy **og** legg til egen auth‑sjekk i funksjonene (f.eks. `Authorization`‑token). Stram inn CORS.

### 3) Manglende tenant‑filter i Vertex Search
- **Hva:** `searchDocuments()` støtter `orgId`, men `ask`‑endepunktet sender ikke `orgId`, og Vertex Search kan bli global.
- **Bevis:** `src/lib/vertex-search.ts`, `src/app/api/ask/route.ts`
- **Risiko:** Kryss‑org datalekkasjer og cache‑forurensing hvis datasett er multitenant.
- **Anbefaling:** Send `orgId` fra `ask`‑ruten, og/eller filtrer i Discovery Engine (serving config / filter).

---

## Medium risiko

### 4) Potensielt farlig fallback til prod‑prosjekt/bucket
- **Hva:** Hvis env mangler, brukes `tetrivo-production` og standard bucket‑navn.
- **Bevis:** `src/lib/vertex-auth.ts`, `src/app/api/upload/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- **Risiko:** Utilsiktede prod‑skriv ved feilkonfig i staging/dev.
- **Anbefaling:** Feil hardt når kritiske env‑vars mangler.

### 5) Team‑kobling kan feile uten rollback (instruksjoner)
- **Hva:** Ved team‑kobling i `/api/instructions` logges feil, men instruksjonen blir stående uten team‑tilknytning.
- **Bevis:** `src/app/api/instructions/route.ts`
- **Risiko:** Instruks kan bli synlig for hele org (ingen team‑filter).
- **Anbefaling:** Gjør transaksjon eller soft‑delete ved feil, slik som i `/api/upload`.

### 6) Kontakt‑rate‑limit fallback er svak i serverless
- **Hva:** In‑memory fallback gir dårlig rate‑limit på serverless.
- **Bevis:** `src/app/api/contact/route.ts`
- **Risiko:** Spam/misbruk ved manglende Upstash i prod.
- **Anbefaling:** Fail‑closed i prod eller påkrevd Upstash.

### 7) CSP tillater `unsafe-inline`
- **Hva:** `script-src` og `style-src` tillater `unsafe-inline`.
- **Bevis:** `next.config.ts`
- **Risiko:** Øker konsekvens ved XSS.
- **Anbefaling:** Innfør nonce‑basert CSP.

### 8) Secrets i `.env.local` (operasjonell risiko)
- **Hva:** Reelle nøkler finnes lokalt.
- **Bevis:** `.env.local`
- **Risiko:** Kompromittering dersom filen lekkes.
- **Anbefaling:** Sørg for at `.env.local` aldri commits; roter nøkler hvis filen har vært delt.

---

## Lav risiko / kodekvalitet

### 9) HTML‑injeksjon i invitasjons‑epost
- **Hva:** `inviterName` og `role` interpoleres direkte i HTML‑epost.
- **Bevis:** `src/lib/emails/invite-email.ts`
- **Risiko:** Begrenset til e‑post, men kan utnyttes til phishing/visuell manipulasjon.
- **Anbefaling:** Escape/strip HTML før interpolering.

### 10) Hardkodede modellnavn
- **Hva:** Modellnavn hardkodet for Gemini og OpenAI embeddings.
- **Bevis:** `src/lib/vertex-chat.ts`, `src/lib/embeddings.ts`
- **Risiko:** Drift/rotasjon blir manuell ved endringer.
- **Anbefaling:** Flytt til env‑vars.

---

## Dokumentasjonsavvik

### README.md – avvik
- **AI‑stack:** README sier Claude/Anthropic, mens kode bruker Vertex Gemini + OpenAI embeddings.
- **API‑liste:** Mangler `/api/gdpr-export`, `/api/instructions` og `/api/confirm-read`; `/api/read-confirmations` er GET (ikke POST).
- **Health:** README sier “Vertex sjekk”, men `/api/health` sjekker kun config‑tilstedeværelse for enkelte tjenester.
- **GitHub Actions:** README nevner `ci.yml` og `security.yml`, finnes ikke i repo.
- **Prosjektstruktur:** `deviations/` vises i README, men finnes ikke i `src/app/(platform)`.
- **Edge Functions:** README nevner kun `generate-embeddings`, men `process-document` finnes også.

### RUNBOOK.md – avvik
- **PDF timeout:** Runbook sier 30s default; kode bruker 20s (`PDF_TIMEOUT_MS`).
- **AI‑tjenester:** Runbook omtaler Anthropic/Claude, men koden bruker Vertex Gemini + OpenAI.
- **Health‑respons:** Runbook viser detaljer som ikke returneres i faktisk respons.
- **Tasks‑varighet:** Runbook sier opptil 60s; `maxDuration` er 300s.
- **GDPR cleanup:** Runbook nevner ikke GCS‑opprydding og `ai_unanswered_questions`.

---

## Anbefalte neste steg (prioritet)
1. Lås ned `/api/tasks/process` (signert auth / secret / IP‑allowlist).
2. Sikre Edge Functions med JWT + egen auth‑sjekk og strammere CORS.
3. Innfør tenant‑filter for Vertex Search (org‑id i query og cache).
4. Fjern prod‑fallbacks og fail hardt på manglende kritiske env‑vars.
5. Oppdater README/RUNBOOK slik at de speiler faktisk drift og endepunkter.

---

## Vedlegg – repo‑oversikt (kort)
- **App:** Next.js App Router (`src/app`)
- **API:** `/api/*`‑routes i `src/app/api`
- **DB:** Supabase SQL i `supabase/sql/consolidated`
- **Edge:** Supabase Functions i `supabase/functions`

