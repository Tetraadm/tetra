# Tetra - AI Context Document

> Denne filen inneholder kritisk kontekst for AI-assistenter som jobber med Tetra-prosjektet.

## Prosjektoversikt

**Tetra** er en norsk SaaS-applikasjon for arbeidsplassinstruksjoner og avvikshåndtering. Appen lar bedrifter:
- Opprette og publisere instrukser til ansatte
- Håndtere avvik og varsler
- Spore lesebekreftelser
- Gi ansatte en AI-assistent ("Spør Tetra") for å svare på spørsmål om instrukser

## Tech Stack

| Teknologi | Versjon | Merknad |
|-----------|---------|---------|
| React | 19 | Nyeste versjon |
| Next.js | 16.1.1 | App Router, Turbopack |
| TypeScript | 5.x | Strict mode |
| Supabase | - | Auth, Database, Storage, RLS |
| Anthropic Claude | claude-3-5-haiku | AI for Spør Tetra |
| lucide-react | 0.562.0 | Ikoner |
| cspell | - | Norsk spellcheck |

### Styling-tilnærming
- **Inline style objects** (TypeScript) - IKKE Tailwind eller CSS modules
- **CSS variabler** i `globals.css` for design tokens
- Tailwind er konfigurert men brukes ikke aktivt

## Mappestruktur

```
src/
├─ app/
│  ├─ admin/
│  │  ├─ AdminDashboard.tsx   # ~530 linjer, hovedkomponent (state/modaler)
│  │  ├─ styles.ts            # Delte styles for admin
│  │  ├─ page.tsx
│  │  ├─ tabs/                # 9 tab-komponenter
│  │  │  ├─ index.ts
│  │  │  ├─ OverviewTab.tsx
│  │  │  ├─ UsersTab.tsx
│  │  │  ├─ TeamsTab.tsx
│  │  │  ├─ InstructionsTab.tsx
│  │  │  ├─ AlertsTab.tsx
│  │  │  ├─ AiLogTab.tsx
│  │  │  ├─ InsightsTab.tsx
│  │  │  ├─ AuditLogTab.tsx
│  │  │  └─ ReadConfirmationsTab.tsx
│  │  ├─ hooks/               # Custom hooks for admin-logikk
│  │  │  ├─ index.ts
│  │  │  ├─ useAdminTeams.ts
│  │  │  ├─ useAdminUsers.ts
│  │  │  ├─ useAdminInstructions.ts
│  │  │  ├─ useAdminAlerts.ts
│  │  │  ├─ useAuditLogs.ts
│  │  │  └─ useReadReport.ts
│  │  └─ components/
│  │     └─ modals.tsx        # Alle admin-modaler (ModalShell + 8 modaler)
│  ├─ employee/
│  │  ├─ EmployeeApp.tsx      # Ansatt-dashboard med Spør Tetra chat
│  │  ├─ page.tsx
│  │  └─ hooks/               # Custom hooks for employee-logikk
│  ├─ leader/
│  │  ├─ LeaderDashboard.tsx  # Teamleder-dashboard
│  │  └─ page.tsx
│  ├─ api/
│  │  ├─ ask/route.ts         # Spør Tetra API (Claude AI)
│  │  └─ upload/route.ts      # Instruks-opplasting (admin-only)
│  ├─ login/
│  │  └─ page.tsx             # Innlogging med Microsoft SSO + e-post OTP
│  ├─ auth/
│  │  └─ callback/            # Supabase auth callback
│  └─ globals.css             # Design tokens som CSS variabler
├─ components/
│  ├─ AuthWatcher.tsx
│  ├─ EmptyState.tsx
│  ├─ FileLink.tsx
│  └─ OfflineBanner.tsx
└─ lib/
   ├─ supabase/
   │  ├─ client.ts            # Browser Supabase client
   │  └─ server.ts            # Server Supabase client
   ├─ ratelimit.ts            # Rate limiting for API
   ├─ keyword-extraction.ts   # Keyword extraction + relevans-score
   ├─ audit-log.ts            # Audit logging
   └─ ui-helpers.ts           # severityColor(), severityLabel()

supabase/
└─ sql/
   ├─ 01_schema.sql
   ├─ 02_seed.sql
   ├─ 03_rpc_functions.sql
   ├─ 04_security_helpers.sql  # get_user_instructions RPC
   ├─ 05_policy_updates.sql
   ├─ 06_alerts_policy_fix.sql
   ├─ 07_storage_policies.sql
   ├─ 08_instruction_reads_update_policy_fix.sql
   ├─ 09_ai_unanswered_questions.sql
   ├─ 10_instructions_add_updated_at.sql
   ├─ 11_rpc_add_updated_at.sql
   ├─ 12_accept_invite.sql
   ├─ 13_db_advisor_fixes.sql
   ├─ 14_rls_optimization.sql
   ├─ 15_policy_consolidation.sql
   ├─ 16_drop_unused_indexes.sql
   └─ 17_add_fk_indexes.sql
```

## Spør Tetra (AI-assistent)

### Arkitektur
```
EmployeeApp.tsx → /api/ask → Claude Haiku → Response med kilde
```

### STRICT Mode (kritisk)
Spør Tetra svarer KUN basert på opplastede instrukser:

1. **Ingen ekstern kunnskap** - AI skal aldri bruke egen kunnskap
2. **Eksakt fallback** - Hvis ikke relevant instruks:
   ```
   Jeg finner ingen relevant instruks i Tetra for dette. Kontakt din leder eller sikkerhetsansvarlig.
   ```
3. **Kildeformat** når svar finnes:
   ```
   Kilde: <Tittel> (oppdatert YYYY-MM-DD)
   Klikk for å åpne: <Tittel>
   ```
4. **source: null** ved fallback - UI viser aldri kilde/link for fallback

### Relevans-scoring
- `MIN_SCORE`: 0.35 (env: `AI_MIN_RELEVANCE_SCORE`)
- Krever `overlapCount > 0` (minst ett keyword-treff)
- Keywords ekstraheres fra tittel + content

### API Response format
```typescript
{
  answer: string,           // Alltid satt (svar eller fallback)
  source: {
    instruction_id: string,
    title: string,
    updated_at: string,     // Fra instructions.updated_at
    open_url_or_route: string
  } | null                  // null ved fallback
}
```

## Sikkerhet

### API-ruter
| Route | Beskyttelse |
|-------|-------------|
| `/api/upload` | Kun `role === 'admin'`, org_id-match |
| `/api/ask` | Rate limiting, input validation (zod) |

### Secrets (server-only)
- `SUPABASE_SERVICE_ROLE_KEY` - Kun i API routes
- `ANTHROPIC_API_KEY` - Kun i `/api/ask`
- Brukes ALDRI i client code (`'use client'`)

### RLS Policies
- `instruction_reads` UPDATE: Krever `user_id = auth.uid()` OG `org_id` match
- Se `supabase/sql/08_instruction_reads_update_policy_fix.sql`

### Feilhåndtering
- Logg detaljer server-side med `console.error`
- Returner generisk norsk feilmelding til klient
- Aldri eksponer interne detaljer i response

## Database-tabeller (Supabase)

| Tabell | Beskrivelse |
|--------|-------------|
| profiles | Brukerprofiler med org_id, role, team_id, email |
| organizations | Organisasjoner |
| teams | Team innen organisasjoner |
| instructions | Instrukser med status (draft/published), updated_at |
| folders | Mapper for instrukser |
| alerts | Avvik/varsler med severity |
| ask_tetra_logs | Logg av Spør Tetra spørsmål og svar |
| ai_unanswered_questions | Spørsmål uten relevant instruks |
| audit_logs | Admin-handlingslogg |
| instruction_reads | Lesebekreftelser |
| invites | Invitasjonslenker |

### Viktige RPC-funksjoner
- `get_user_instructions(p_user_id)` - Henter instrukser basert på brukerens team

## Spellcheck (cspell)

### Oppsett
```bash
npm install --save-dev cspell @cspell/dict-nb-no
```

### Konfigurasjon (cspell.json)
- Språk: `en,nb-NO`
- Dictionary: `nb-no`
- flagWords: `gjor`, `sporsmal`, `nermeste`, `naermeste`
- Ignorerer: node_modules, .next, dist, build, lockfiles

### Kjør spellcheck
```bash
npx cspell "src/**/*.{ts,tsx}"
```

## Design System

### Fargepalett (CSS variabler i globals.css)
```css
--color-background: #F8FAFC    /* Bakgrunn */
--color-surface: #FFFFFF       /* Kort/paneler */
--color-primary: #2563EB       /* Hovedfarge (blå) */
--color-primary-hover: #1D4ED8 /* Hover state */
--color-text: #0F172A          /* Hovedtekst */
--color-text-secondary: #64748B /* Sekundærtekst */
--color-border: #E2E8F0        /* Kantlinjer */
--color-danger: #DC2626        /* Feil/varsler */
--color-success: #10B981       /* Suksess */
--color-warning: #F59E0B       /* Advarsel */
```

### Severity-farger
```typescript
// Fra lib/ui-helpers.ts
severityColor(severity: string) => { bg: string, color: string }
// critical: rød, high: oransje, medium: gul, low: grønn
```

## Viktige konvensjoner

### Språk
- UI-tekst er på **norsk bokmål** med riktig ø/æ/å
- Kodekommentarer og variabelnavn er på **engelsk**
- Konsekvent terminologi: "Spør Tetra", "Instrukser", "Avvik"

### Ikoner
- Bruk alltid `lucide-react`, ikke emoji eller andre biblioteker
- Import-mønster: `import { IconName } from 'lucide-react'`

### Styling
- Ingen Tailwind-klasser i komponenter
- Inline style objects med TypeScript
- Bruk CSS variabler via `var(--color-xxx)` der det gir mening

### State Management
- React useState/useEffect
- Ingen Redux eller annen state manager
- Data hentes direkte fra Supabase

## Nyttige kommandoer

```bash
npm run dev        # Start utviklingsserver
npm run build      # Bygg for produksjon
npm run lint       # Kjør ESLint
npx cspell "src/**/*.{ts,tsx}"  # Spellcheck
npx tsc --noEmit   # Type check
```

## Kjente Issues

### ESLint-konfigurasjon
Det finnes en pre-eksisterende ESLint-advarsel om `eslint-config-next` module resolution. Dette påvirker ikke build eller runtime.

### Windows-kompatibilitet
Prosjektet kjører på Windows. Ved bash-kommandoer:
- Bruk `npm`/`npx` direkte (ikke `cd /d`)
- Unngå Windows-spesifikk syntaks

### Modal-tilgjengelighet
Fikset i admin-modaler (Escape, fokus-trap, auto-fokus, ARIA).

## Tips for AI-assistenter

1. **Les først, endre etterpå** - Les alltid filen før du redigerer
2. **Behold inline styles** - Ikke konverter til Tailwind
3. **Norsk UI-tekst** - Hold all brukervendt tekst på norsk med riktig ø/æ/å
4. **lucide-react** - Bruk dette for alle ikoner
5. **Sjekk styles.ts** - Admin-styles er sentralisert her
6. **isMobile pattern** - Responsivitet håndteres med useState
7. **Secrets kun i API routes** - Aldri i client code
8. **Generiske feilmeldinger** - Logg detaljer server-side, returner kort norsk tekst
9. **SQL-filer nummereres** - Neste fil er `18_xxx.sql`
10. **STRICT Spør Tetra** - Aldri la AI svare utenfor instruksene
