# Tetrivo HMS – Sikkerhetsoversikt

**Dato:** 2026-01-26  
**Versjon:** 1.0  
**For:** Sikkerhetsansvarlig

---

## 1. Arkitekturoversikt

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Supabase       │────▶│   PostgreSQL    │
│   (Vercel EU)   │     │   (Stockholm)    │     │   + pgvector    │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ├──▶ Google Cloud (Vertex AI EU) - AI-chat + embeddings
         ├──▶ Google Document AI (EU) - PDF OCR
         └──▶ Upstash Redis (Frankfurt) - Rate limiting
```

---

## 2. Autentisering & Autorisasjon

### 2.1 Autentisering
- **Supabase Auth** med JWT-tokens
- E-postbekreftelse påkrevd
- Invitasjonsbasert onboarding (lukket system)
- Sikre cookies med `httpOnly`, `secure`, `sameSite`

### 2.2 RBAC (Rollebasert tilgangskontroll)
| Rolle | Tilgang |
|-------|---------|
| `admin` | Full tilgang til org-data, brukeradministrasjon |
| `employee` | Lesetilgang til instrukser, AI-spørsmål |

### 2.3 Row-Level Security (RLS)
- **Aktivert på alle tabeller** med brukerdata
- Policies sjekker `auth.uid()` og `org_id`
- Admin-sjekker gjøres både i RLS og API-ruter

---

## 3. Datakryptering

| Lag | Kryptering |
|-----|------------|
| **Transit** | TLS 1.3 (HTTPS everywhere) |
| **At-rest** | AES-256 (Supabase-managed) |
| **Tokens/Keys** | Miljøvariabler, aldri i kode |

### Headers
- `Strict-Transport-Security: max-age=63072000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 4. Input-validering & Sanitering

| Punkt | Tiltak |
|-------|--------|
| API-input | Zod schema-validering |
| HTML-innhold | `sanitize-html` (XSS-beskyttelse) |
| Filopplasting | Magic bytes + MIME-validering |
| SQL | Parameteriserte spørringer (Supabase client) |

---

## 5. Rate Limiting

| Endepunkt | Grense | Fallback |
|-----------|--------|----------|
| `/api/ask` | 20/min per bruker | Fail-closed (503) |
| `/api/upload` | 10/min per bruker | Fail-closed (503) |
| `/api/contact` | 5/time per IP | Fail-closed (503) |

**Backend:** Upstash Redis (EU - Frankfurt)

---

## 6. Logging & Overvåking

### 6.1 Audit Logs
- Alle admin-handlinger logges
- PII saniteres (e-post maskeres)
- 90 dagers retention

### 6.2 Feilrapportering
- Sentry (EU) for runtime-feil
- Ingen PII i feilmeldinger

---

## 7. GDPR Compliance

| Krav | Implementert |
|------|--------------|
| Data i EU | ✅ Supabase Stockholm, Upstash Frankfurt |
| Dataminimering | ✅ Kun nødvendig data lagres |
| Samtykke | ✅ Invitasjonsbasert, ToS ved registrering |
| DSAR-eksport | ✅ `/api/gdpr-export` |
| DSAR-sletting | ✅ `gdpr_hard_delete_user` RPC |
| Retention | ✅ 90 dagers auto-sletting (cron) |

---

## 8. Subprosessorer

Se [SUBPROCESSORS.md](./SUBPROCESSORS.md) for komplett liste.

---

## 9. Incident Response

### Ved sikkerhetsbrudd:
1. **Umiddelbart:** Isoler (roter nøkler, blokk tilgang)
2. **Innen 1 time:** Varsle intern ansvarlig
3. **Innen 72 timer:** Vurder melding til Datatilsynet
4. **Innen 1 uke:** Post-mortem og dokumentasjon

### Kontakt
- **Teknisk:** [din-epost]
- **Datatilsynet:** https://www.datatilsynet.no/

---

## 10. Sikkerhetssjekkliste (Pilot)

- [x] RLS på alle tabeller
- [x] Input-validering med Zod
- [x] HTML-sanitering
- [x] Rate limiting
- [x] Audit logging
- [x] PII-maskering
- [x] EU-datalagring
- [x] Daglige backups
- [ ] MFA (planlagt post-pilot)
- [ ] CSP med nonce (planlagt)
