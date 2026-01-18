# Tetra HMS

> **Digital HMS-plattform for norske virksomheter**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

Tetra er en digital HMS-plattform (Helse, Miljø og Sikkerhet) som gjør arbeidsmiljøstyring enkelt og tilgjengelig for norske bedrifter. Plattformen har AI-drevet assistanse via Claude, dokumenthåndtering, teamorganisering og omfattende revisjonslogging.

---

## Innhold

- [Funksjoner](#-funksjoner)
- [Teknologi](#-teknologi)
- [Forutsetninger](#-forutsetninger)
- [Installasjon](#-installasjon)
- [Miljøvariabler](#-miljøvariabler)
- [Bruk](#-bruk)
- [Prosjektstruktur](#-prosjektstruktur)
- [Database](#-database)
- [API-dokumentasjon](#-api-dokumentasjon)
- [Autentisering](#-autentisering)
- [Deployment](#-deployment)
- [Bidrag](#-bidrag)

---

## Funksjoner

| Funksjon | Beskrivelse |
|----------|-------------|
| **Spør Tetra (AI)** | Naturlig språk Q&A drevet av Claude 3.5 Haiku med kontekst fra bedriftens sikkerhetsdokumenter |
| **Instrukshåndtering** | Last opp, organiser og distribuer sikkerhetsinstrukser med PDF-tekstekstraksjon |
| **Teamorganisering** | Hierarkisk teamstruktur med rollebasert tilgang (Admin, Teamleder, Ansatt) |
| **Sanntidsvarsler** | Opprett og distribuer sikkerhetsvarsler til spesifikke team |
| **Lesebekreftelser** | Spor hvilke ansatte som har lest og bekreftet sikkerhetsdokumenter |
| **Revisjonslogging** | Omfattende aktivitetslogging for compliance |
| **Multi-tenant** | Full tenant-isolasjon med Row Level Security (RLS) |
| **Norsk grensesnitt** | All brukervendt tekst på norsk bokmål |

---

## Teknologi

| Lag | Teknologi |
|-----|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 3.4, CSS Custom Properties |
| **Backend** | Next.js API Routes (Node.js runtime) |
| **Database** | Supabase (PostgreSQL med RLS) |
| **Autentisering** | Supabase Auth (Magic Link + Microsoft Azure SSO) |
| **Lagring** | Supabase Storage (dokumentopplasting) |
| **AI** | Anthropic Claude 3.5 Haiku |
| **Rate Limiting** | Upstash Redis (med in-memory fallback) |
| **E-post** | Resend (transaksjonelle e-poster) |
| **Deployment** | Vercel |

---

## Forutsetninger

- **Node.js** 20+ (LTS anbefalt)
- **npm** 10+
- **Supabase-prosjekt** med database konfigurert
- **Anthropic API-nøkkel** for AI-funksjoner
- **Resend-konto** (valgfritt, for e-postinvitasjoner)
- **Upstash Redis** (valgfritt, faller tilbake til in-memory)

---

## Installasjon

### 1. Klon repositoriet

```bash
git clone https://github.com/Tetraadm/tetra.git
cd tetra
```

### 2. Installer avhengigheter

```bash
npm install
```

### 3. Konfigurer miljøvariabler

Opprett en `.env.local`-fil i prosjektroten:

```bash
cp .env.example .env.local
```

Se [Miljøvariabler](#-miljøvariabler) for alle nødvendige variabler.

### 4. Sett opp databasen

Kjør SQL-migrasjoner i rekkefølge i Supabase SQL Editor:

```
supabase/sql/00_migrations_table.sql
supabase/sql/01_schema.sql
supabase/sql/02_seed.sql
...
supabase/sql/26_rpc_security_fix.sql
```

### 5. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

---

## Miljøvariabler

### Påkrevde variabler

| Variabel | Beskrivelse |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Din Supabase prosjekt-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonym/offentlig nøkkel |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role nøkkel (kun server, aldri eksponer til klient) |
| `ANTHROPIC_API_KEY` | Anthropic API-nøkkel for Claude AI |

### Valgfrie variabler

| Variabel | Standard | Beskrivelse |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Basis-URL for invitasjonslenker |
| `RESEND_API_KEY` | - | Resend API-nøkkel for e-postinvitasjoner |
| `RESEND_FROM_EMAIL` | `Tetra HMS <onboarding@resend.dev>` | Avsender-e-post for invitasjoner |
| `UPSTASH_REDIS_REST_URL` | - | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | - | Upstash Redis token |
| `AI_RATE_LIMIT` | `20` | Maks AI-forespørsler per vindu |
| `AI_RATE_WINDOW_SECONDS` | `60` | Rate limit vindu (sekunder) |
| `UPLOAD_RATE_LIMIT` | `10` | Maks opplastinger per vindu |
| `UPLOAD_RATE_WINDOW_SECONDS` | `60` | Opplasting rate limit vindu |
| `INVITE_RATE_LIMIT` | `10` | Maks invitasjoner per vindu |
| `INVITE_RATE_WINDOW_SECONDS` | `3600` | Invitasjon rate limit vindu (1 time) |
| `MAX_UPLOAD_MB` | `10` | Maksimal filopplastingsstørrelse i MB |
| `AI_MIN_RELEVANCE_SCORE` | `0.35` | Minimum relevansscore for AI-svar |

### Eksempel `.env.local`

```env
# Supabase (påkrevd)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI (påkrevd)
ANTHROPIC_API_KEY=sk-ant-api03-...

# App URL (påkrevd for produksjon)
NEXT_PUBLIC_APP_URL=https://tetra.onl

# E-post (valgfritt)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Tetra HMS <no-reply@tetra.onl>

# Redis (valgfritt - faller tilbake til in-memory)
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Bruk

### Tilgjengelige kommandoer

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Start utviklingsserver med Turbopack |
| `npm run build` | Bygg for produksjon |
| `npm run start` | Start produksjonsserver |
| `npm run lint` | Kjør ESLint |
| `npm run typecheck` | Kjør TypeScript typesjekkeing |
| `npm run spellcheck` | Kjør stavekontroll på kildefiler |

### Brukerroller

| Rolle | Tilgang |
|-------|---------|
| **Admin** | Full tilgang: administrer brukere, team, instrukser, varsler, se logger |
| **Teamleder** | Se teammedlemmer, instrukser, administrer teamvarsler, inviter brukere |
| **Ansatt** | Se tildelte instrukser, bekreft lesing, still spørsmål til AI |

---

## Prosjektstruktur

```
tetra/
├── src/
│   ├── app/                    # Next.js App Router sider
│   │   ├── admin/              # Admin-dashboard
│   │   ├── employee/           # Ansatt-dashboard
│   │   ├── leader/             # Teamleder-dashboard
│   │   ├── login/              # Autentiseringsside
│   │   ├── invite/[token]/     # Invitasjonsaksept-flyt
│   │   ├── auth/               # Auth callback-håndterere
│   │   ├── post-auth/          # Post-login routing
│   │   └── api/                # API-ruter
│   │       ├── ask/            # AI Q&A endepunkt
│   │       ├── upload/         # Filopplasting endepunkt
│   │       ├── invite/         # Invitasjon endepunkt
│   │       ├── read-confirmations/ # Lesebekreftelser
│   │       └── audit-logs/     # Revisjonslogger
│   ├── components/             # Delte React-komponenter
│   ├── lib/                    # Hjelpefunksjoner
│   │   ├── supabase/           # Supabase klient-oppsett
│   │   ├── ratelimit.ts        # Rate limiting logikk
│   │   ├── types.ts            # TypeScript typedefinisjoner
│   │   └── ui-helpers.ts       # UI-hjelpefunksjoner
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── sql/                    # Database-migrasjoner (00-26)
├── public/                     # Statiske ressurser
├── docs/                       # Dokumentasjon
└── .agent/                     # AI-agent konfigurasjon
```

---

## Database

### Hovedtabeller

| Tabell | Beskrivelse |
|--------|-------------|
| `organizations` | Tenant-organisasjoner |
| `teams` | Team innenfor organisasjoner |
| `profiles` | Brukerprofiler (utvider auth.users) |
| `instructions` | Sikkerhetsdokumenter og instrukser |
| `instruction_teams` | M:N mapping av instrukser til team |
| `instruction_reads` | Sporing av lesebekreftelser |
| `folders` | Mapper for dokumentorganisering |
| `alerts` | Sikkerhetsvarsler og notifikasjoner |
| `alert_teams` | M:N mapping av varsler til team |
| `invites` | Brukerinvitasjonstokens |
| `audit_logs` | Aktivitets-audit trail |
| `ask_tetra_logs` | AI Q&A historikk |
| `ai_unanswered_questions` | Spørsmål AI ikke kunne svare på |

### Sikkerhetsfunksjoner

- **Row Level Security (RLS)** aktivert på alle tabeller
- **Tenant-isolasjon** - brukere kan kun se data i egen organisasjon
- **Rollebasert tilgang** - policyer håndhever Admin/Teamleder/Ansatt-tillatelser
- **Soft delete** - `deleted_at` kolonne for GDPR-compliance
- **Revisjonslogging** - alle mutasjoner logges

### Migrasjoner

Migrasjoner ligger i `supabase/sql/` og skal kjøres i numerisk rekkefølge:

| Fil | Beskrivelse |
|-----|-------------|
| `00_migrations_table.sql` | Migrasjonssporing |
| `01_schema.sql` | Hovedskjema |
| `02_seed.sql` | Testdata |
| `03_rpc_functions.sql` | RPC-funksjoner |
| `04_security_helpers.sql` | Sikkerhetshjelpere |
| `05-23_*.sql` | Diverse oppdateringer |
| `24_block_direct_client_storage.sql` | Storage-sikkerhet |
| `25_read_confirmations_rpc.sql` | Lesebekreftelser RPC |
| `26_rpc_security_fix.sql` | RPC sikkerhetsfiks + profiles.deleted_at |

---

## API-dokumentasjon

### `POST /api/ask`

AI-drevet Q&A endepunkt.

**Request:**
```json
{
  "question": "Hvordan håndterer vi brannfare?"
}
```

**Response:**
```json
{
  "answer": "Basert på dokumentet [Brannrutiner]: ...",
  "source": {
    "instruction_id": "uuid",
    "title": "Brannrutiner",
    "updated_at": "2026-01-15T10:00:00Z",
    "open_url_or_route": "/employee?instruction=uuid"
  }
}
```

### `POST /api/upload`

Last opp instruksdokumenter (kun Admin).

**Request:** `multipart/form-data`
| Felt | Type | Beskrivelse |
|------|------|-------------|
| `file` | File | PDF, TXT, PNG eller JPG (maks 10MB) |
| `title` | String | Dokumenttittel |
| `orgId` | UUID | Organisasjons-ID |
| `severity` | String | `low` \| `medium` \| `critical` |
| `status` | String | `draft` \| `published` |
| `folderId` | UUID | (valgfritt) Mappe-ID |
| `teamIds` | JSON | Array av team-UUIDs |
| `allTeams` | Boolean | `true` \| `false` |

### `POST /api/invite`

Send brukerinvitasjon (kun Admin/Teamleder).

**Request:**
```json
{
  "email": "bruker@eksempel.no",
  "role": "employee",
  "team_id": "uuid"
}
```

### `GET /api/read-confirmations`

Hent lesebekreftelsesstatistikk (kun Admin/Teamleder).

**Query params:** `limit`, `offset`

---

## Autentisering

### Autentiseringsmetoder

1. **Magic Link (OTP)** - E-postbasert passordløs innlogging
2. **Microsoft Azure SSO** - OAuth-integrasjon for enterprise SSO

### Autorisasjonsflyt

```
1. Bruker logger inn via /login
2. Supabase Auth callback på /auth/callback
3. Middleware sjekker sesjon på beskyttede ruter
4. Rollebasert redirect til riktig dashboard:
   - Admin → /admin
   - Teamleder → /leader
   - Ansatt → /employee
```

### Invitasjonsflyt

```
1. Admin oppretter invitasjon via /api/invite
2. E-post sendes med lenke /invite/[token]
3. Bruker aksepterer invitasjon, oppretter konto
4. Profil kobles automatisk til organisasjon/team
```

---

## Deployment

### Vercel (anbefalt)

1. Importer prosjekt fra GitHub
2. Sett miljøvariabler i Vercel dashboard
3. Deploy

**Nødvendige Vercel-miljøvariabler:**
- Alle variabler fra [Miljøvariabler](#-miljøvariabler)

### Produksjons-URL

Live på: [https://tetra.onl](https://tetra.onl)

---

## Bidrag

1. Fork repositoriet
2. Opprett en feature-branch: `git checkout -b feature/ny-funksjon`
3. Commit endringer: `git commit -m 'Legg til ny funksjon'`
4. Push til branch: `git push origin feature/ny-funksjon`
5. Åpne en Pull Request

### Kodestandarder

- Kjør `npm run lint` før commit
- Kjør `npm run typecheck` for å sikre typesikkerhet
- All UI-tekst må være på norsk bokmål
- Følg eksisterende kodemønstre og styling

---

## Lisens

Proprietær. Alle rettigheter forbeholdt.

---

## Kontakt

- **GitHub Issues**: [Rapporter feil eller be om funksjoner](https://github.com/Tetraadm/tetra/issues)
- **E-post**: support@tetra.onl

---

*Bygget for norsk arbeidsmiljøsikkerhet*
