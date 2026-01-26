# Subprosessorer – Tetrivo HMS

**Sist oppdatert:** 2026-01-26  
**Behandlingsansvarlig:** Tetrivo AS

---

## Oversikt

Tetrivo bruker følgende underleverandører (subprosessorer) for å levere HMS-tjenesten. Alle behandler personopplysninger på vegne av Tetrivo.

---

## Subprosessorer

| Leverandør | Tjeneste | Databehandling | Region | DPA Status |
|------------|----------|----------------|--------|------------|
| **Supabase Inc.** | Database, Autentisering, Lagring | Brukerdata, HMS-dokumenter, audit logs | Stockholm, Sverige (EU) | ✅ Inkludert i ToS |
| **Anthropic** | AI-assistanse (Claude) | Anonymiserte HMS-spørsmål | EU endpoint | ✅ DPA tilgjengelig |
| **OpenAI** | Tekst-embeddings | Dokumentinnhold (for søk) | US | ⚠️ SCC kreves |
| **Upstash** | Rate limiting (Redis) | IP-hasher, bruker-ID | Frankfurt, Tyskland (EU) | ✅ GDPR-compliant |
| **Vercel Inc.** | Webhosting | Trafikkdata, logger | Frankfurt, Tyskland (EU) | ✅ Inkludert i DPA |
| **Resend** | Transaksjonell e-post | E-postadresser, navn | US | ⚠️ SCC kreves |
| **Sentry** | Feilrapportering | Feilmeldinger (uten PII) | EU | ✅ GDPR-compliant |

---

## Dataoverføringsmekanismer

### EU-baserte leverandører
- **Supabase, Upstash, Vercel (EU), Sentry**: Ingen overføring utenfor EØS

### US-baserte leverandører
For leverandører i USA brukes:
- **Standard Contractual Clauses (SCC)** som godkjent av EU-kommisjonen
- Supplementære tiltak der nødvendig

---

## Endringer i subprosessorer

Behandlingsansvarlig vil varsle databehandler minst **30 dager** før nye subprosessorer tas i bruk eller eksisterende endres vesentlig.

---

## Kontakt

For spørsmål om databehandling, kontakt:
- **E-post:** personvern@tetrivo.com
