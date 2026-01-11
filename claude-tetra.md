# Tetra - AI Context Document

> Denne filen inneholder kritisk kontekst for AI-assistenter som jobber med Tetra-prosjektet.

## Prosjektoversikt

**Tetra** er en norsk SaaS-applikasjon for arbeidsplassinstruksjoner og avvikshåndtering. Appen lar bedrifter:
- Opprette og publisere instrukser til ansatte
- Håndtere avvik og varsler
- Spore lesebekreftelser
- Gi ansatte en AI-assistent for å svare på spørsmål om instrukser

## Tech Stack

| Teknologi | Versjon | Merknad |
|-----------|---------|---------|
| React | 19 | Nyeste versjon |
| Next.js | 16.1.1 | App Router, Turbopack |
| TypeScript | 5.x | Strict mode |
| Supabase | - | Auth, Database, Storage |
| lucide-react | 0.562.0 | Ikoner |
| react-hot-toast | - | Notifikasjoner |

### Styling-tilnærming
- **Inline style objects** (TypeScript) - IKKE Tailwind eller CSS modules
- **CSS variabler** i `globals.css` for design tokens
- Tailwind er konfigurert men brukes ikke aktivt

## Mappestruktur

```
src/
├─ app/
│  ├─ admin/
│  │  ├─ AdminDashboard.tsx   # ~1800 linjer, hovedkomponent for admin
│  │  ├─ styles.ts            # Delte styles for admin
│  │  └─ page.tsx
│  ├─ employee/
│  │  ├─ EmployeeApp.tsx      # Ansatt-dashboard med AI-chat
│  │  └─ page.tsx
│  ├─ leader/
│  │  ├─ LeaderDashboard.tsx  # Teamleder-dashboard
│  │  └─ page.tsx
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
   ├─ audit-log.ts            # Audit logging
   ├─ keyword-extraction.ts   # AI keyword extraction
   ├─ invite-cleanup.ts       # Invite link cleanup
   └─ ui-helpers.ts           # severityColor(), etc.
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

### Severity-farger (avvik)
```typescript
// Fra lib/ui-helpers.ts
severityColor(severity: string) => { bg: string, color: string }
// critical: rød, high: oransje, medium: gul, low: grønn
```

### Viktige style-mønstre
```typescript
// Admin styles importeres fra styles.ts
import { createAdminStyles } from './styles'
const styles = createAdminStyles(isMobile)

// Responsive sjekk
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth < 768)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
}, [])
```

## Nøkkelkomponenter

### AdminDashboard.tsx
- Tabs: oversikt, brukere, team, instrukser, avvik, ailogg, innsikt, auditlog, lesebekreftelser
- State: `tab`, `showMobileMenu`, diverse modaler
- Bruker lucide-react ikoner for all navigasjon

### EmployeeApp.tsx
- 2-kolonners desktop layout (main + sidebar)
- Tabs: home, instructions, chat
- AI-chat med streaming-svar
- Responsiv: stacker på mobil

### Login page.tsx
- Microsoft SSO (Azure) + e-post magic link
- Gradient bakgrunn med dekorative sirkler
- Supabase OTP auth

## Database-tabeller (Supabase)

| Tabell | Beskrivelse |
|--------|-------------|
| profiles | Brukerprofiler med org_id, role, team_id |
| organizations | Organisasjoner |
| teams | Team innen organisasjoner |
| instructions | Instrukser med status (draft/published) |
| folders | Mapper for instrukser |
| alerts | Avvik/varsler med severity |
| ai_logs | Logg av AI-spørsmål og svar |
| audit_logs | Admin-handlingslogg |
| instruction_reads | Lesebekreftelser |
| invites | Invitasjonslenker |

## Viktige konvensjoner

### Språk
- UI-tekst er på **norsk**
- Kodekommentarer og variabelnavn er på **engelsk**

### Ikoner
- Bruk alltid `lucide-react`, ikke emoji eller andre biblioteker
- Import-mønster: `import { IconName } from 'lucide-react'`

### Styling
- Ingen Tailwind-klasser
- Inline style objects med TypeScript
- Bruk CSS variabler via `var(--color-xxx)` der det gir mening

### State Management
- React useState/useEffect
- Ingen Redux eller annen state manager
- Data hentes direkte fra Supabase

## Kjente Issues

### ESLint-konfigurasjon
Det finnes en pre-eksisterende ESLint-advarsel om `eslint-config-next` module resolution. Dette påvirker ikke build eller runtime.

### Windows-kompatibilitet
Ved bash-kommandoer, vær oppmerksom på at prosjektet kjører på Windows. Bruk `mkdir -p` via bash heller enn Windows `if exist` syntaks.

## Nyttige kommandoer

```bash
npm run dev      # Start utviklingsserver
npm run build    # Bygg for produksjon
npm run lint     # Kjør ESLint
```

## Tips for AI-assistenter

1. **Les først, endre etterpå** - Les alltid filen før du redigerer
2. **Behold inline styles** - Ikke konverter til Tailwind
3. **Norsk UI-tekst** - Hold all brukervendt tekst på norsk
4. **lucide-react** - Bruk dette for alle ikoner
5. **Sjekk styles.ts** - Admin-styles er sentralisert her
6. **isMobile pattern** - Responsivitet håndteres med useState
