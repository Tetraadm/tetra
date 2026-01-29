# Tetrivo – Masterplan

**Dato:** 2026-01-28  
**Sist oppdatert:** 2026-01-29  
**Mål:** Én arbeidsliste du kan jobbe deg nedover, med kun relevante punkter per i dag.

---

## 📊 Oppsummering

| Prioritet   | Åpne | Fikset |
|-------------|------|--------|
| Kritisk     | 0    | 0      |
| Høy         | 1    | 2      |
| Medium      | 5    | 9      |
| Lav         | 6    | 7      |
| Performance | 3    | 0      |
| **Total**   | **15** | **18** |

---

# 🔴 MÅ FIKSES

## Høy Prioritet (1 åpen)

### H-03 Operasjonelt (pilot/ISO): tilgang og leverandører

- **Bevis:** Supabase Dashboard, leverandøravtaler
- **Problem:** Før pilot må følgende verifiseres/gjøres:
- **Gjør:**
  - [ ] MFA for admin i Supabase (policy)
  - [ ] Backups/PITR: verifiser restore-prosedyre (test i ikke-prod)
  - [ ] Subprosessorliste + DPA-status: oppdater til faktisk stack (Google/Supabase/Vercel/Sentry/Upstash/Resend)

---

## Medium Prioritet (5 åpne)

### M-02 Debug/console logging i prod-kode

- **Bevis:** `src/app/api/ask/route.ts`, `src/app/api/upload/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- **Problem:** 7+ debug logs som kjører i produksjon
- **Gjør:** Bytt til strukturert logging (pino) + nivåstyring, eller gate til `NODE_ENV !== 'production'`

### M-03 PDF parsing: kun total-timeout

- **Bevis:** `src/app/api/upload/route.ts` (PDF_TIMEOUT_MS)
- **Problem:** Ingen per-side abort ved PDF parsing
- **Gjør:** Legg inn per-side abort + god feilmelding til bruker

### M-06 Team-admin UI: menypunkter uten handling

- **Bevis:** `src/app/(platform)/instructions/admin/tabs/TeamsTab.tsx`
- **Problem:** "Rediger"/"Administrer medlemmer" uten onClick
- **Gjør:** Implementer eller fjern/disable menypunktene
- **Status:** Delvis fikset - menypunkter er nå disabled med "(kommer snart)" tekst

### M-09 Stille feil i bakgrunnsoperasjoner

- **Bevis:** `src/app/api/upload/route.ts` (linje 434-460)
- **Problem:** GCS uploads og embeddings feil logges bare, varsles ikke til bruker
- **Gjør:** Track async job status eller vis warning hvis embedding feiler

---

## Lav Prioritet (6 åpne)

### L-02 Audit logging: "client"-wrapper brukes fortsatt

- **Bevis:** `src/lib/audit-log.ts`, hooks i admin
- **Problem:** Gammel wrapper brukes fortsatt
- **Gjør:** Bytt til `logAuditEvent()` direkte

### L-04 Bygg-warnings

- **Bevis:** `npm run build`
- **Problem:** Deprecated middleware-konvensjon + MODULE_TYPELESS
- **Gjør:** Migrer fra `middleware` til `proxy`, juster `tailwind.config.ts`

### L-07 TypeScript `as` casts uten runtime validering

- **Bevis:** `src/app/api/ask/route.ts:70`, `src/app/api/upload/route.ts:307`
- **Problem:** Type assertions kan gi undefined properties
- **Gjør:** Legg til runtime validation med Zod

### L-08 Manglende accessibility (aria-labels)

- **Bevis:** `src/app/(platform)/instructions/admin/tabs/TeamsTab.tsx`
- **Problem:** Avatar og badges mangler aria-labels
- **Gjør:** Legg til `aria-label` på interaktive elementer

### L-10 Manglende tester for kritiske paths

- **Bevis:** `tests/` directory
- **Problem:** Mangler tester for AI-søk, re-indexing, org isolation
- **Gjør:** Skriv unit tests for kritisk funksjonalitet

### L-13 Cache TTL for kort

- **Bevis:** `src/lib/cache.ts`
- **Problem:** Search cache TTL er 60s - kort for low-frequency queries
- **Gjør:** Vurder lengre TTL (300-600s)

---

## Performance (3 åpne)

### P-01 Manglende indekser på foreign keys

- **Bevis:** Supabase Performance Advisor
- **Problem:** 5 FK-kolonner mangler covering index
- **Gjør:** Legg til indekser:
  - `ai_unanswered_questions.user_id`
  - `ask_tetrivo_logs.source_instruction_id`
  - `gdpr_requests.processed_by`
  - `gdpr_requests.user_id`
  - `instruction_reads.user_id`

### P-02 Ubrukte indekser

- **Bevis:** Supabase Performance Advisor
- **Problem:** 3 indekser på `instructions` er aldri brukt
- **Gjør:** Vurder fjerning av:
  - `idx_instructions_status`
  - `idx_instructions_severity`
  - `idx_instructions_keywords`

### P-03 Auth DB connection strategy

- **Bevis:** Supabase Performance Advisor
- **Problem:** Auth bruker absolutt antall (10), ikke percentage-based
- **Gjør:** Bytt til percentage-based i Dashboard

---

## Må verifiseres i pilot

- [ ] Invitasjonsflyt på mobil: Radix Select (team/rolle)
- [ ] Opprett instruks/kunngjøring på mobil (modals/select)
- [ ] Kunngjøringer: toggle/deaktiver/reaktiver end-to-end

---

# ✅ FIKSET

## Høy (2 fikset)

### H-01 ~~Vertex Search tenant-miks~~ ✅

- **Løst:** 2026-01-28
- **Bevis:** `supabase/functions/vertex-search/index.ts`
- **Gjort:** Org-filtrering via URI-path i vertex-export og vertex-search

### H-02 ~~GCP service account key i repo~~ ✅

- **Løst:** 2026-01-28
- **Bevis:** Fil slettet fra repo
- **Gjort:** Nøkkel lagret sikkert utenfor repo

---

## Medium (9 fikset)

### M-01 ~~CSP: `unsafe-inline`~~ ✅

- **Løst:** 2026-01-29
- **Bevis:** `src/middleware.ts`, `src/app/layout.tsx`
- **Gjort:** Implementert nonce-basert CSP i middleware, fjernet `unsafe-inline`. Nonce sendes til next-themes via layout for å sikre at theme-script også har nonce.

### M-04 ~~Team-kobling: mangler rollback ved feil~~ ✅

- **Løst:** 2026-01-29
- **Bevis:** `src/app/api/instructions/route.ts`
- **Gjort:** Lagt til soft-delete av instruks hvis team-kobling feiler (samme mønster som upload/route.ts)

### M-05 ~~Edge Functions CORS wildcard~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Fjernet wildcard CORS fra alle 6 Edge Functions (kun server-til-server)

### M-07 ~~Anthropic-referanser i runtime~~ ✅

- **Løst:** 2026-01-28
- **Gjort:** Fjernet ANTHROPIC_API_KEY fra health-check og CSP

### M-08 ~~Svak feilhåndtering i embeddings~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Lagt til runtime validering av Vertex AI response-struktur

### M-10 ~~Promise rejection i Edge Function~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Lagt til try-catch rundt fetch-kall i process-document

### M-11 ~~JSON.parse uten try-catch~~ ✅

- **Løst:** 2026-01-29 (verifisert)
- **Gjort:** normalizeKeywords() hadde allerede try-catch

### M-12 ~~Rate limit env-parsing~~ ✅

- **Løst:** 2026-01-29 (verifisert)
- **Gjort:** parseEnvInt() returnerer fallback ved ugyldige verdier

### M-13 ~~In-memory rate limiter memory leak~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Lagt til periodisk cleanup av stale entries

### M-14 ~~GDPR hard-delete uten audit trail~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Lagt til audit log entry før hard-delete i gdpr-cleanup

---

## Lav (7 fikset)

### L-01 ~~Invite e-post XSS~~ ✅

- **Løst:** 2026-01-28
- **Gjort:** Lagt til `escapeHtml()` i invite-email.ts

### L-03 ~~Next.js version mismatch~~ ✅

- **Løst:** 2026-01-28
- **Gjort:** Oppdatert package.json til `next: ^16.1.6`

### L-05 ~~Utdatert AI-dokumentasjon~~ ✅

- **Løst:** 2026-01-28
- **Gjort:** README, SUBPROCESSORS, SECURITY_SUMMARY oppdatert til Vertex AI/Gemini

### L-06 ~~OpenAI i dependencies~~ ✅

- **Løst:** 2026-01-28
- **Gjort:** Flyttet til devDependencies

### L-09 ~~Inkonsistente feilmeldinger (EN vs NO)~~ ✅

- **Løst:** 2026-01-29
- **Gjort:** Oversatt engelske feilmeldinger i gdpr-cleanup til norsk

### L-11 ~~Unused code (`void ip`)~~ ✅

- **Løst:** 2026-01-29
- **Bevis:** `src/app/api/ask/route.ts`
- **Gjort:** Fjernet ubrukt `getClientIp` import og `ip` variabel fullstendig (ikke bare `void ip`)

### L-12 ~~Manglende ENV dokumentasjon~~ ✅

- **Løst:** 2026-01-29
- **Bevis:** `.env.example`
- **Gjort:** Oppdatert `.env.example` med Vertex AI som primary AI provider, lagt til manglende variabler (GCS_BUCKET_NAME, EDGE_FUNCTION_SECRET, Document AI config), flyttet Anthropic/OpenAI til legacy-seksjon

---

# ✅ Verifisert i Supabase MCP Scan

- ✅ 16/16 tabeller har RLS aktivert
- ✅ 0 security advisories
- ✅ 23 SECURITY DEFINER funksjoner med `SET search_path`
- ✅ 6/6 Edge Functions deployet og ACTIVE
- ✅ pg_cron GDPR cleanup jobb aktiv (månedlig)
- ✅ Storage bucket `instructions` er private
- ✅ Soft-delete kolonner på plass

---

*Sist oppdatert: 2026-01-29*
