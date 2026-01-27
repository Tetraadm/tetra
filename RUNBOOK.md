# Tetrivo HMS Runbook

Operasjonell runbook for pilot-drift. Sist oppdatert: 2026-01-27.

---

## 1. Login / SSO-feil

### Symptomer
- Brukere får "Unauthorized" eller 401
- Redirect-loop til /login

### Feilsøking
1. **Sjekk Supabase Auth logs:** Dashboard → Logs → Auth
2. **Verifiser env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Sjekk cookie issues:** Incognito-modus, tredjepartscookies blokkert?
4. **Session expired:** Sjekk `supabase.auth.getSession()` i nettleser console

### Løsning
- Hvis massivt: Restart Supabase auth (Dashboard → Project Settings → Restart)
- Individuell bruker: Be bruker slette cookies og logge inn på nytt

---

## 2. E-post / Invite-feil

### Symptomer
- Invitasjons-e-post kommer ikke frem
- "Resend failed" i server-logger

### Feilsøking
1. **Sjekk Resend dashboard:** [resend.com/overview](https://resend.com/overview)
2. **Verifiser env var:** `RESEND_API_KEY`
3. **Sjekk avsenderdomene:** `RESEND_FROM_EMAIL` må være verifisert domene

### Løsning
- Hvis Resend nede: Kopier invitasjonslenke manuelt fra API-respons
- Rate limit: Resend har 100/dag på free tier

---

## 3. Upload / Storage-feil

### Symptomer
- "Kunne ikke laste opp filen" feilmelding
- 500-feil på `/api/upload`

### Feilsøking
1. **Sjekk filstørrelse:** Maks er `MAX_UPLOAD_MB` (default 10MB)
2. **Verifiser storage bucket:** Supabase Dashboard → Storage → `instructions`
3. **Sjekk service role key:** `SUPABASE_SERVICE_ROLE_KEY` må være satt
4. **PDF-parsing timeout:** `PDF_TIMEOUT_MS` (default 30s), `PDF_MAX_PAGES` (default 50)

### Løsning
- Stort PDF: Øk `PDF_MAX_PAGES` eller `PDF_TIMEOUT_MS` i env
- Storage full: Sjekk quota i Supabase Dashboard

---

## 4. AI Service Feil (Vertex AI / Gemini)

### Symptomer
- "Tjenesten er midlertidig utilgjengelig" (503)
- "Kunne ikke generere svar" (500)
- Embeddings feiler / ingen resultater i AI-søk

### Komponenter
Systemet bruker **kun Google Cloud** for AI:
- **Gemini 2.0 Flash** - Chat/svar-generering (`gemini-2.0-flash-001`)
- **Vertex AI Embeddings** - Semantisk søk (`text-multilingual-embedding-002`, 768 dim)
- **Document AI OCR** - PDF tekstutvinning (processor: `c741d9fd2e1301ad`)

### Feilsøking
1. **Google Auth:** Sjekk at `GOOGLE_CREDENTIALS_JSON` er gyldig JSON (minifisert).
2. **IAM Roller:** Service account må ha:
   - `Vertex AI User`
   - `Discovery Engine Editor`
   - `Document AI API User`
   - `Storage Object Admin` (for GCS bucket)
3. **Vertex Quotas:** Sjekk GCP Console for quota-overskridelser.
4. **Edge Function Logs:** Sjekk Supabase Dashboard -> Edge Functions -> Logs:
   - `generate-embeddings` - Vertex AI embedding-generering
   - `process-document` - Document AI OCR for PDF-er
5. **Document AI Processor:** Sjekk at processor er aktiv i GCP Console -> Document AI.

### Løsning
- **IAM Feil:** Gi riktig rolle i GCP IAM.
- **Quota:** Be om økt quota eller bytt region i koden.
- **Edge Function Timeout:** Supabase Edge Functions har 60s timeout - store PDF-er kan feile.
- **Embedding Mismatch:** Database bruker 768-dimensjons vektorer - sørg for at embeddings-modellen matcher.

---

## 5. Database / RLS-feil

### Symptomer
- "Forbidden" (403) på operasjoner som burde være tillatt
- Tom data selv om den finnes

### Feilsøking
1. **Sjekk brukerens org_id:** Matcher den dataens org_id?
2. **Sjekk rolle:** Har bruker riktig rolle (`admin`, `teamleder`, `employee`)?
3. **RLS policies:** Supabase Dashboard → Table Editor → [tabell] → Policies
4. **Audit log:** Sjekk `audit_logs` tabell for feilede forsøk

### Løsning
- Hvis RLS er restriktiv: Verifiser at policy matcher forventet bruksmønster
- Bruker mangler profil: Sjekk `profiles` tabell

---

## 6. GDPR Sletteforespørsler

### Symptomer
- Bruker har bedt om sletting av konto
- Pending request i admin-dashboard

### Arbeidsflyt
1. **Bruker sender forespørsel:** Via "Konto" → "Be om sletting"
2. **Admin varsles:** E-post til alle org-admins
3. **Admin behandler:** Admin-dashboard → GDPR-fane
4. **Godkjenn/Avvis:** Klikk handling, skriv evt. notat
5. **Ved godkjenning:** Bruker slettes automatisk via `gdpr_hard_delete_user()`

### Database
```sql
-- Sjekk pending requests
SELECT * FROM gdpr_requests WHERE status = 'pending';

-- Historikk
SELECT * FROM gdpr_requests WHERE org_id = 'ORG_ID';
```

### Manuell sletting (nødstilfelle)
```sql
SELECT public.gdpr_hard_delete_user('USER_ID_HER');
```

> ⚠️ ADVARSEL: Sletting er permanent og kan ikke angres!

---

## 7. GDPR Log Cleanup

### Automatisk (GitHub Actions)
Kjører månedlig via `.github/workflows/gdpr-cleanup.yml`.

**Sjekk status:** GitHub → Actions → gdpr-cleanup

### Manuell trigger
```bash
curl -X POST https://tetrivo.com/api/gdpr-cleanup \
  -H "Authorization: Bearer $GDPR_CLEANUP_SECRET"
```

### Hva slettes
- `audit_logs` eldre enn `GDPR_RETENTION_DAYS` (default 90)
- `ask_tetrivo_logs` eldre enn retention period

### Sjekk siste kjøring
```sql
SELECT * FROM gdpr_retention_runs ORDER BY executed_at DESC LIMIT 5;
```

### Supabase Backup
Supabase Pro har automatisk daglig PITR (Point-in-Time Recovery).

**Restore-prosedyre:**
1. Gå til Supabase Dashboard → Project Settings → Database
2. Klikk "Restore" → Velg tidspunkt
3. Bekreft restore (tar 5-30 min avhengig av størrelse)

> ⚠️ ADVARSEL: Restore overskriver nåværende data!

---

## 9. Rollback Deploy (Vercel)

### Instant Rollback
1. Gå til [Vercel Dashboard](https://vercel.com)
2. Velg prosjektet → Deployments
3. Finn forrige fungerende deployment
4. Klikk "..." → "Promote to Production"

### Manuell Rollback via Git
```bash
git revert HEAD
git push origin main
```

---

## 8. Edge Functions (Embeddings & OCR)

### Arkitektur
Tunge oppgaver kjøres via **Supabase Edge Functions** (Deno runtime):
- `generate-embeddings` - Genererer Vertex AI embeddings (768 dim)
- `process-document` - Ekstraherer tekst fra PDF via Document AI OCR

### Hvorfor Edge Functions?
Google Cloud-biblioteker (Document AI, Vertex AI SDK) fungerer ikke med Next.js Turbopack.
Edge Functions løser dette ved å bruke Deno runtime med HTTP API direkte.

### Feilsøking
1. **Sjekk logs:** Supabase Dashboard -> Edge Functions -> Logs
2. **Sjekk secrets:** Edge Functions -> Secrets må inneholde:
   - `GOOGLE_CREDENTIALS_JSON`
   - `GCS_BUCKET_NAME`
   - `DOCUMENT_AI_PROCESSOR_ID`
   - `DOCUMENT_AI_LOCATION`
3. **Timeout:** Edge Functions har 60s timeout - store PDF-er kan feile

### Deploy Edge Functions
```bash
# Krever Supabase CLI og innlogget bruker
supabase functions deploy generate-embeddings
supabase functions deploy process-document
```

### Manuell testing
```bash
# Test embeddings
curl -X POST "https://rshukldzekufrlkbsqrr.supabase.co/functions/v1/generate-embeddings" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test tekst"}'
```

---

## 10. Overvåkning / Alerting

### Anbefalte verktøy
- **Error tracking:** Sentry (✅ installert)
- **Uptime:** UptimeRobot, Better Uptime
- **Logs:** Vercel Logs, Supabase Logs

### Kritiske metrics å overvåke
- 5xx error rate > 1%
- Response time p95 > 3s
- Auth failures spike
- Storage usage > 80%

---

## 11. Kontaktpunkter

| Rolle | Kontakt | Ansvar |
|-------|---------|--------|
| Teknisk lead | dev@tetrivo.com | Feilsøking, deploys, arkitektur |
| Pilot-kontakt | pilot@tetrivo.com | Brukerhenvendelser, feedback |
| Supabase support | support@supabase.io | Database/auth issues |
| Vercel support | support@vercel.com | Hosting/deploy issues |
| Resend support | support@resend.com | E-post leveringsproblemer |
| Google Cloud status | status.cloud.google.com | Vertex AI / Document AI status |

---

## 12. Health Endpoint

**URL:** `GET /api/health`

**Respons (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-21T17:13:26.671Z",
  "version": "0.1.0",
  "uptime": 0.68,
  "checks": {
    "database": { "status": "ok", "ms": 5 },
    "rateLimiter": { "status": "ok", "details": { "isConfigured": true, "provider": "upstash" }},
    "externalServices": { "status": "ok", "details": { "anthropic": true, "resend": true, "sentry": true }}
  },
  "responseTime": 5
}
```

**Status koder:**
- `200` - Alt fungerer
- `503` - Degradert (noe feiler)

**Bruk:** Konfigurer uptime-monitor til å polle denne hvert 1-5 min.

---

## 13. Pilot SLA

| Kritikalitet | Responstid | Løsningstid |
|--------------|------------|-------------|
| Kritisk (nedetid) | 1 time | 4 timer |
| Høy (funksjonsfeil) | 4 timer | 1 dag |
| Medium | 1 dag | 3 dager |
| Lav | 3 dager | 1 uke |

---

## 14. Monitorering (Anbefalt)

### Sentry (Error Tracking)

✅ **Allerede installert og konfigurert.**

Sjekk `sentry.client.config.ts`, `sentry.server.config.ts`, og `sentry.edge.config.ts` for konfigurasjon.

### UptimeRobot (Gratis uptime)
1. Opprett konto på uptimerobot.com
2. Legg til monitor: `https://tetrivo.com/api/health`
3. Sett intervall: 5 min
4. Aktiver e-post/Slack alerts
