# Tetra HMS Runbook

Operasjonell runbook for pilot-drift. Sist oppdatert: 2026-01-17.

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

## 4. AI / Anthropic-feil

### Symptomer
- "Tjenesten er midlertidig utilgjengelig" (503)
- "Kunne ikke behandle spørsmålet" (500)

### Feilsøking
1. **Rate limit (429):** Sjekk Upstash dashboard for rate limit status
2. **503 Service Unavailable:** Upstash ikke konfigurert! Sjekk `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
3. **Anthropic API error:** Sjekk `ANTHROPIC_API_KEY`, sjekk Anthropic status page
4. **Ingen relevante instrukser:** AI svarer med fallback fordi ingen matcher

### Løsning
- Rate limit: Vent til window resetter (se `X-RateLimit-Reset` header)
- Upstash mangler: Konfigurer i Vercel env vars, redeploy
- Anthropic nede: Vent, eller deaktiver Spør Tetra midlertidig

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

## 6. Backup / Restore

### Supabase Backup
Supabase Pro har automatisk daglig PITR (Point-in-Time Recovery).

**Restore-prosedyre:**
1. Gå til Supabase Dashboard → Project Settings → Database
2. Klikk "Restore" → Velg tidspunkt
3. Bekreft restore (tar 5-30 min avhengig av størrelse)

> ⚠️ ADVARSEL: Restore overskriver nåværende data!

---

## 7. Rollback Deploy (Vercel)

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

## 8. Overvåkning / Alerting

### Anbefalte verktøy
- **Error tracking:** Sentry (ikke installert ennå)
- **Uptime:** UptimeRobot, Better Uptime
- **Logs:** Vercel Logs, Supabase Logs

### Kritiske metrics å overvåke
- 5xx error rate > 1%
- Response time p95 > 3s
- Auth failures spike
- Storage usage > 80%

---

## 9. Kontaktpunkter

| Rolle | Kontakt | Ansvar |
|-------|---------|--------|
| Teknisk lead | dev@tetrivo.com | Feilsøking, deploys, arkitektur |
| Pilot-kontakt | pilot@tetrivo.com | Brukerhenvendelser, feedback |
| Supabase support | support@supabase.io | Database/auth issues |
| Vercel support | support@vercel.com | Hosting/deploy issues |
| Resend support | support@resend.com | E-post leveringsproblemer |
| Anthropic status | status.anthropic.com | AI API status |

---

## 10. Health Endpoint

**URL:** `GET /api/health`

**Respons (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T08:00:00.000Z",
  "version": "0.1.0",
  "checks": {
    "database": { "status": "ok", "ms": 45 }
  },
  "responseTime": 50
}
```

**Status koder:**
- `200` - Alt fungerer
- `503` - Degradert (noe feiler)

**Bruk:** Konfigurer uptime-monitor til å polle denne hvert 1-5 min.

---

## 11. Pilot SLA

| Kritikalitet | Responstid | Løsningstid |
|--------------|------------|-------------|
| Kritisk (nedetid) | 1 time | 4 timer |
| Høy (funksjonsfeil) | 4 timer | 1 dag |
| Medium | 1 dag | 3 dager |
| Lav | 3 dager | 1 uke |

---

## 12. Monitorering (Anbefalt)

### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Legg til i `.env.local`:
```
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### UptimeRobot (Gratis uptime)
1. Opprett konto på uptimerobot.com
2. Legg til monitor: `https://tetrivo.com/api/health`
3. Sett intervall: 5 min
4. Aktiver e-post/Slack alerts
