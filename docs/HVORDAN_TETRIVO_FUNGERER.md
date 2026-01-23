# Hvordan Tetrivo Fungerer

> En komplett oversikt over plattformens arkitektur og funksjoner

---

## 📋 Kort oppsummering

Tetrivo er en **HMS-plattform** (Helse, Miljø og Sikkerhet) for norske bedrifter. Admin laster opp HMS-dokumenter (PDF, tekst), systemet trekker ut teksten automatisk, og ansatte kan bruke en AI-assistent for å stille spørsmål og få svar basert på bedriftens egne dokumenter.

---

## 🏗️ Arkitektur

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Landing Page  │    │  Admin Portal   │    │ Ansatt Portal   │
│   (tetrivo.com) │    │  /admin         │    │ /employee       │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    Next.js API        │
                    │  (Server-side)        │
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│    Supabase     │    │   Anthropic     │    │     OpenAI      │
│   (Database +   │    │   Claude AI     │    │   (Embeddings)  │
│    Storage)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 👤 Brukerroller

| Rolle | Beskrivelse | Tilgang |
|-------|-------------|---------|
| **Admin** | Organisasjonsadministrator | Full kontroll: laste opp dokumenter, opprette team, invitere brukere, se statistikk |
| **Teamleder** | Leder for et team | Administrere eget team, se lesebekreftelser for sitt team |
| **Ansatt** | Vanlig bruker | Lese instrukser, signere lesebekreftelser, bruke AI-assistent |

---

## 📄 Dokumentopplasting (Admin-flyt)

### Hva skjer når admin laster opp en PDF?

```
1. Admin velger fil (PDF/TXT/PNG/JPG)
        ↓
2. Fil valideres (størrelse, type, magic bytes)
        ↓
3. Filen lastes opp til Supabase Storage
        ↓
4. Tekst ekstraheres automatisk fra PDF
        ↓
5. Nøkkelord ekstraheres fra teksten
        ↓
6. Vektor-embedding genereres (OpenAI)
        ↓
7. Instruks lagres i databasen med all metadata
        ↓
8. Instruks kobles til valgte team
```

### Detaljer fra koden (`/api/upload/route.ts`):

**Filvalidering:**
- Maks størrelse: 10 MB (konfigurerbart)
- Tillatte filtyper: PDF, TXT, PNG, JPG
- Verifiserer "magic bytes" for å hindre MIME-spoofing

**PDF-tekstekstraksjon:**
- Bruker `pdf.js` biblioteket
- Maks 50 sider (konfigurerbart)
- Timeout på 30 sekunder
- Maks 500.000 tegn

**AI-forberedelse:**
- Ekstraherer 10 nøkkelord fra tittel + innhold
- Genererer vektor-embedding (1536 dimensjoner) via OpenAI
- Lagrer embedding for semantisk søk

---

## 🤖 AI-Assistenten ("Spør Tetrivo")

### Hvordan fungerer spørsmål → svar?

```
1. Ansatt stiller spørsmål
        ↓
2. Rate limiting sjekkes (maks 50 spørsmål/time)
        ↓
3. Brukerens tilgang verifiseres
        ↓
4. SØKEFASE:
   ├── Prøv vektor-søk først (semantisk likhet)
   └── Fallback til nøkkelord-søk hvis vektor feiler
        ↓
5. Topp 10 relevante instrukser hentes
        ↓
6. Kontekst bygges fra disse dokumentene
        ↓
7. Claude AI (Haiku 3.5) får spørsmål + kontekst
        ↓
8. AI svarer KUN basert på dokumentene
        ↓
9. Svar returneres (med streaming)
        ↓
10. Spørsmål og svar logges for analyse
```

### Tilgangskontroll for AI

AI-assistenten ser **kun** dokumenter som:
1. Tilhører brukerens organisasjon
2. Er publisert (status = "published")
3. Er mappet til et team brukeren er medlem av

Dette sikres via SQL-funksjonen `get_user_instructions()` og `match_instructions()`.

### Søkemetoder

**Hybrid-søk (primær, ny implementasjon):**
- Kombinerer vektor-søk og full-text search med Reciprocal Rank Fusion (RRF)
- Dokumenter chunkes i ~800-tegns biter med overlapp
- Hver chunk får sin egen vektor-embedding og tsvector for norsk full-text
- Vektor-terskel: 0.2 similarity score
- RRF-formel: `score = 1/(60 + vector_rank) + 1/(60 + fts_rank)`

**Legacy vektor-søk (fallback):**
- Brukes hvis ingen chunks eksisterer
- Matcher mot hele dokumenters embeddings
- Terskel: minimum 0.25 similarity score

**Nøkkelord-søk (siste fallback):**
- Brukes hvis OpenAI ikke er konfigurert
- Scorer dokumenter basert på nøkkelord-overlapp
- Minimum relevans-score: 0.35

### AI-regler (System Prompt)

AI-en er strengt instruert til å:
- **KUN** sitere fra bedriftens dokumenter
- **ALDRI** bruke ekstern kunnskap
- **ALDRI** gi egne anbefalinger
- Alltid referere til kilden
- Si "Jeg finner ingen relevant instruks" hvis svaret ikke finnes

---

## ✅ Lesebekreftelse

Ansatte må signere at de har lest viktige instrukser.

### Flyt:
1. Admin publiserer instruks til et team
2. Ansatte i teamet ser instruksen i sin liste
3. Ansatte åpner og leser instruksen
4. Ansatte klikker "Bekreft lest"
5. Signaturen lagres med tidsstempel
6. Admin/Teamleder kan se hvem som har lest

### Database-tabeller:
- `instruction_reads` - Hvem har lest hva og når
- `instruction_teams` - Hvilke team ser hvilke instrukser

---

## 📊 Database-struktur

### Hovedtabeller

| Tabell | Beskrivelse |
|--------|-------------|
| `organizations` | Organisasjoner (tenants) |
| `profiles` | Brukerprofiler med rolle og team |
| `teams` | Team innenfor en organisasjon |
| `instructions` | HMS-dokumenter med innhold og embedding |
| `instruction_teams` | Kobling mellom instrukser og team |
| `instruction_reads` | Lesebekreftelser |
| `folders` | Mapper for kategorisering |
| `audit_logs` | Aktivitetslogg for GDPR |
| `ask_tetra_logs` | Logg over AI-spørsmål |
| `ai_unanswered_questions` | Spørsmål AI ikke kunne besvare |

### Row Level Security (RLS)

Alle tabeller har RLS-policyer som sikrer:
- Brukere kan kun se data fra egen organisasjon
- Instrukser filtreres basert på team-tilhørighet
- Admin har utvidet tilgang innenfor sin org

---

## 🔐 Sikkerhet

### Autentisering
- Magic link via e-post (Supabase Auth)
- Ingen passord å huske

### Autorisasjon
- Server-side validering på alle API-kall
- RLS på database-nivå
- Rolle-basert tilgangskontroll

### Rate Limiting
- Opplasting: begrenset per bruker
- AI-spørsmål: 50 per time
- Fail-closed i produksjon

### GDPR
- Automatisk sletting av gamle logger (90 dager)
- DSAR-støtte (Data Subject Access Request)
- Audit trail for alle handlinger

### Compliance og Sertifiseringer
Vi arbeider kontinuerlig etter strenge internasjonale standarder:
- **GDPR i EU:** Full etterlevelse av personvernforordningen med innebygd "Privacy by Design".
- **ISO-sertifisering:** Plattformen og prosesser er utformet med mål om å møte kravene i **ISO 27001** (Informasjonssikkerhet) og **ISO 9001** (Kvalitetsstyring).
- **Datasupverenitet:** Alle data lagres innenfor EØS (Sverige/Irland) for å sikre compliance.

---

## 📧 Varsling

- E-post sendes via Resend
- Varsler ved nye dokumenter
- Invitasjoner til nye brukere
- Kontaktskjema fra landing page

---

## 🌐 API-endepunkter

| Endepunkt | Metode | Beskrivelse |
|-----------|--------|-------------|
| `/api/ask` | POST | AI-drevet Q&A med streaming |
| `/api/upload` | POST | Filopplasting (kun Admin) |
| `/api/invite` | POST | Brukerinvitasjon |
| `/api/confirm-read` | POST | Registrer lesebekreftelse |
| `/api/contact` | POST | Kontaktskjema |
| `/api/health` | GET | Health check |
| `/api/gdpr-request` | POST/GET/PATCH | GDPR sletteforespørsler |
| `/api/gdpr-cleanup` | POST | GDPR log cleanup (cron) |

---

## 🚀 Teknologi-stack

| Komponent | Teknologi |
|-----------|-----------|
| Frontend | Next.js 16.1, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Supabase) |
| Vektor-søk | pgvector + OpenAI embeddings |
| AI | Claude Haiku 3.5 (Anthropic) |
| E-post | Resend |
| Rate Limiting | Upstash Redis |
| Error Tracking | Sentry |
| Hosting | Vercel |
| Storage | Supabase Storage (EU/Sverige) |

---

## 📱 Brukerflyten

### For Admin:
1. Logger inn → `/admin`
2. Laster opp PDF/dokument
3. Velger team som skal se det
4. Publiserer instruksen
5. Følger med på lesebekreftelser

### For Ansatt:
1. Logger inn → `/employee`
2. Ser liste over instrukser for sitt team
3. Leser og signerer instrukser
4. Bruker "Spør Tetrivo" for spørsmål
5. Får svar basert på bedriftens dokumenter

---

## 📈 Logging og analyse

Systemet logger:
- Alle AI-spørsmål og svar
- Ubesvarte spørsmål (for forbedring)
- Lesebekreftelser
- Aktivitetslogg for audit

Admin kan bruke dette til å:
- Se hvilke spørsmål ansatte stiller
- Identifisere manglende dokumentasjon
- Følge opp at alle har lest viktige instrukser

---

*Dokumentasjon oppdatert: Januar 2026*
*Tetrivo Systems – Fremtidens HMS-plattform*
