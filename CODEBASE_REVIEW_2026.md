# TETRA CODEBASE REVIEW — FULLSTENDIG RAPPORT

**Dato:** 12. januar 2026  
**Reviewer:** Claude Opus (AI Code Review)  
**Versjon:** 0.1.0

---

## 1. EXECUTIVE SUMMARY

Tetra er en solid MVP-app med god grunnstruktur. **Hovedfunn:**
- **Sikkerhet:** RLS-policies er godt implementert, men invite-flow har token-eksponering via localStorage som bør hardenes. Service-role key brukes korrekt kun server-side.
- **Arkitektur:** God separasjon av concerns (hooks, tabs, components), men to mega-komponenter (`EmployeeApp.tsx` 1003 linjer, `AdminDashboard.tsx` 531 linjer) bør splittes.
- **Ytelse:** Mangler server-side paginering på admin-lister og logger - vil bli et problem ved skalering.
- **Type-sikkerhet:** Bruker `string` for role/severity/status der union-types bør brukes.
- **DX:** Bra CI med eslint/spellcheck, men next.config.ts er tom og kan hardenes.

**Pilot-readiness:** ~85%. 5-7 dagers arbeid for å nå produksjonskvalitet.

---

## 2. ARKITEKTUR-OVERSIKT

### 2.1 Routes/Pages

| Route | Funksjon | Tilgangskontroll |
|-------|----------|------------------|
| `/login` | Magic link + Azure SSO | Public |
| `/auth/callback` | PKCE/OTP exchange | Public |
| `/invite/[token]` | Invite-aksept flow | Public (token-validert) |
| `/post-auth` | Role-basert redirect | Authenticated |
| `/admin` | Admin dashboard | role=admin |
| `/leader` | Teamleder dashboard | role=teamleader |
| `/employee` | Ansatt-app | role=employee |

### 2.2 API Routes

| Endpoint | Funksjon | Sikkerhet |
|----------|----------|-----------|
| `/api/upload` | PDF/fil upload | Auth + Admin-sjekk + Rate limit |
| `/api/ask` | AI-spørsmål (Anthropic) | Auth + Rate limit + Org-validering |
| `/api/confirm-read` | Lesebekreftelse | Auth + Org-validering |
| `/api/audit-logs` | Aktivitetslogg | Auth + Admin-sjekk |
| `/api/read-confirmations` | Leserapport | Auth + Admin-sjekk |

### 2.3 Dataflyt

```
UI (Client Component)
  → Supabase Client / API Route
    → Supabase (RLS enforced) / Service Role (storage only)
      → PostgreSQL + Storage
```

### 2.4 Database-tabeller

- `organizations` — Bedrifter/organisasjoner
- `teams` — Team innenfor organisasjoner
- `profiles` — Brukerprofiler (extends auth.users)
- `folders` — Mapper for instrukser
- `instructions` — HMS-instrukser
- `instruction_teams` — Many-to-many: instruks ↔ team
- `instruction_reads` — Lesebekreftelser
- `alerts` — Varsler/avvik
- `alert_teams` — Many-to-many: varsel ↔ team
- `invites` — Invitasjoner
- `audit_logs` — Aktivitetslogg
- `ask_tetra_logs` — AI-spørsmål logg
- `ai_unanswered_questions` — Ubesvarte AI-spørsmål

### 2.5 RPC-funksjoner (security definer)

- `get_invite_by_token(p_token)` — Invite lookup (anon/auth)
- `accept_invite(p_token, p_full_name)` — Atomic invite acceptance
- `get_profile_context(p_user_id)` — RLS helper
- `get_user_instructions(p_user_id)` — Team-aware instruction fetch
- `get_user_alerts(p_user_id)` — Team-aware alert fetch
- `my_org_id()` — Cached org lookup for RLS optimization

---

## 3. "MÅ" FIKSES — KRITISKE SIKKERHETSFUNN

### MÅ-1: Invite-token eksponeres i localStorage

**Fil:** `src/app/invite/[token]/AcceptInvite.tsx:39-45`

```typescript
localStorage.setItem('invite_data', JSON.stringify({
  token,
  fullName,
  orgId: invite.org_id,
  teamId: invite.team_id,
  role: invite.role
}))
```

**Risiko:** **HØY** — Token lagres i localStorage og kan potensielt lekke via XSS eller browser extensions. Inneholder også org_id, team_id, role som kan manipuleres.

**Fix:** Bruk server-side session/cookie i stedet. Callback-routen henter allerede token fra URL.

---

### MÅ-2: Manglende MIME-type validering på fil-innhold (PDF parsing)

**Fil:** `src/app/api/upload/route.ts:88-94`

```typescript
if (!ALLOWED_FILE_TYPES.includes(file.type)) {
  return NextResponse.json(
    { error: 'Ugyldig filtype. Tillatte typer: PDF, TXT, PNG, JPG' },
    { status: 400 }
  )
}
```

**Risiko:** **MEDIUM** — `file.type` er client-supplied og kan spoofes. En ondsinnet fil kan sendes med feil MIME-type.

**Fix:** Valider magic bytes/file signature server-side i tillegg til extension.

---

### MÅ-3: pdf-parse bibliotek har kjente sårbarheter

**Fil:** `package.json:22`

```json
"pdf-parse": "^1.1.1"
```

**Risiko:** **MEDIUM-HØY** — pdf-parse v1.1.1 har kjente prototype pollution og DoS-sårbarheter. Kan brukes til RCE i visse scenarioer.

**Fix:** Bytt til `pdf.js-extract`, `pdfjs-dist`, eller kjør pdf-parsing i isolert container/worker.

---

### MÅ-4: Rate limiting bruker IP som fallback til "unknown"

**Fil:** `src/lib/ratelimit.ts:165`

```typescript
return 'unknown'
```

**Risiko:** **MEDIUM** — Hvis alle requests får samme IP (f.eks. bak proxy uten headers), deler de rate limit bucket.

**Fix:** Legg til bruker-ID i rate limit identifier for autentiserte requests.

---

### MÅ-5: Storage policy mangler write/delete-beskyttelse

**Fil:** `supabase/sql/07_storage_policies.sql:12-22`

```sql
create policy "Org members can read instruction files"
  on storage.objects for select
  using (...)
```

**Risiko:** **LAV-MEDIUM** — Kun SELECT policy definert. Upload/delete går via service-role som er OK, men eksplisitt INSERT/UPDATE/DELETE policies bør blokkere anon/authenticated.

**Fix:** Legg til eksplisitte deny-policies for INSERT/UPDATE/DELETE for authenticated users.

---

## 4. "BØR" FIKSES — YTELSE, VEDLIKEHOLD, UX

### BØR-1: Manglende server-side paginering

**Filer:** 
- `src/app/api/audit-logs/route.ts:37` — bruker `limit` men ingen offset
- `src/app/api/read-confirmations/route.ts` — henter ALT uten paginering

**Konsekvens:** Ved 1000+ brukere/instrukser vil admin-dashboard bli tregt.

**Fix:** Implementer cursor-basert eller offset-basert paginering med `range()`.

---

### BØR-2: Mega-komponenter bør splittes

**Filer:**
- `src/app/employee/EmployeeApp.tsx` — **1003 linjer**
- `src/app/admin/AdminDashboard.tsx` — **531 linjer**
- `src/app/admin/styles.ts` — **10508 bytes**

**Konsekvens:** Vanskelig å vedlikeholde, teste, og code-splitte.

**Fix:** Splitt render-funksjoner til separate komponenter. Flytt inline styles til CSS modules eller Tailwind.

---

### BØR-3: Types bruker `string` i stedet for union types

**Fil:** `src/lib/types.ts:9, 29-30`

```typescript
role: string  // Bør være: 'admin' | 'teamleader' | 'employee'
severity: string  // Bør være: 'low' | 'medium' | 'critical'
status: string  // Bør være: 'draft' | 'published'
```

**Konsekvens:** Ingen compile-time validering, lettere å introdusere bugs.

---

### BØR-4: Manglende error boundary og strukturert logging

**Fil:** `src/app/error.tsx` finnes men ingen Sentry/strukturert logging.

**Konsekvens:** Vanskelig å debugge produksjonsfeil.

**Fix:** Integrer Sentry eller lignende, legg til strukturerte log-felter.

---

### BØR-5: next.config.ts er tom

**Fil:** `next.config.ts:3-5`

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Konsekvens:** Mangler sikkerhetshardening (CSP headers, image domains, etc.)

---

### BØR-6: Ingen CSP (Content Security Policy)

**Risiko:** XSS-angrep kan kjøre vilkårlig JavaScript.

**Fix:** Legg til CSP headers i next.config.ts eller middleware.

---

### BØR-7: Supabase client opprettes multiple ganger

**Fil:** `src/app/login/page.tsx:20`

```typescript
const supabase = createClient()  // Inne i handleLogin
```

Andre steder bruker `useMemo` korrekt. Inkonsistent.

---

## 5. "KAN" FORBEDRES/SLETTES — CLEANUP

### KAN-1: Ubrukte/redundante filer

- `src/proxy.ts` — 251 bytes, ser ut til å være ubrukt
- `ai-qa-test.md`, `tetra-chatgpt.md`, `codex-handoff.md` — Docs som kan flyttes til `/docs`
- `spellcheck-report.md` — Generert fil, bør gitignores
- `AUDIT_REPORT.md`, `AUDIT_REPORT_v2.md` — Gamle rapporter

### KAN-2: Duplisert SQL-logikk

SQL-filene 05, 14, 15 redefinerer samme policies. Konsolider til én autoritativ fil.

### KAN-3: Unused _team variabel

**Fil:** `src/app/employee/EmployeeApp.tsx:43,48`

```typescript
export default function EmployeeApp({ ..., team: _team, ... }: Props) {
  void _team
```

Team-prop mottas men brukes ikke.

### KAN-4: Inline styles vs CSS

Hele appen bruker inline `style={{}}` objekter. Vurder Tailwind/CSS modules for bedre DX og bundle-størrelse.

### KAN-5: tsconfig.json kan strammes

**Fil:** `tsconfig.json` — mangler:

```json
"noUncheckedIndexedAccess": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true
```

---

## 6. TOP 5 PATCHES — KONKRETE ENDRINGER

### PATCH 1: Fjern token fra localStorage, bruk kun URL-basert flow

**Før** (`src/app/invite/[token]/AcceptInvite.tsx:38-45`):

```typescript
localStorage.setItem('invite_data', JSON.stringify({
  token,
  fullName,
  orgId: invite.org_id,
  teamId: invite.team_id,
  role: invite.role
}))
```

**Etter**:

```typescript
// Lagre kun fullName midlertidig (ikke sensitiv data)
sessionStorage.setItem('invite_fullname', fullName)
// Token håndteres via URL i callback
```

Tilsvarende endring for `handleAzureAccept`. Callback-routen henter token fra URL allerede.

---

### PATCH 2: Legg til magic bytes validering for filer

**Ny funksjon i** `src/app/api/upload/route.ts`:

```typescript
const FILE_SIGNATURES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/png': [0x89, 0x50, 0x4E, 0x47],       // .PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF],            // JPEG
}

function validateFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType]
  if (!signature) return true // text/plain has no signature
  return signature.every((byte, i) => bytes[i] === byte)
}
```

**Bruk etter linje 131**:

```typescript
const fileBytes = new Uint8Array(fileBuffer)
if (!validateFileSignature(fileBytes, file.type)) {
  return NextResponse.json(
    { error: 'Filinnholdet matcher ikke oppgitt filtype' },
    { status: 400 }
  )
}
```

---

### PATCH 3: Strenge union types i types.ts

**Før** (`src/lib/types.ts:5-12`):

```typescript
export type Profile = {
  id: string
  full_name: string
  email?: string | null
  role: string
  org_id: string
  team_id: string | null
}
```

**Etter**:

```typescript
export type Role = 'admin' | 'teamleader' | 'employee'
export type Severity = 'low' | 'medium' | 'critical'
export type InstructionStatus = 'draft' | 'published'

export type Profile = {
  id: string
  full_name: string
  email?: string | null
  role: Role
  org_id: string
  team_id: string | null
}

export type Instruction = {
  id: string
  title: string
  content: string | null
  severity: Severity
  status: InstructionStatus
  folder_id: string | null
  file_path: string | null
  folders: { name: string } | null
}
```

---

### PATCH 4: Rate limit med bruker-ID for autentiserte requests

**Før** (`src/app/api/ask/route.ts:95-96`):

```typescript
const ip = getClientIp(request)
const { success, ... } = await aiRatelimit.limit(ip)
```

**Etter**:

```typescript
const ip = getClientIp(request)
// ... etter user auth på linje 129 ...
const rateLimitKey = user ? `user:${user.id}` : `ip:${ip}`
const { success, ... } = await aiRatelimit.limit(rateLimitKey)
```

Flytt rate limit-sjekken til ETTER auth for å bruke user.id.

---

### PATCH 5: Harden next.config.ts med security headers

**Før** (`next.config.ts`):

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Etter**:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';"
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
```

---

## 7. DEPENDENCY & CONFIG REVIEW

### 7.1 package.json analyse

| Package | Status | Kommentar |
|---------|--------|-----------|
| `pdf-parse@1.1.1` | ⚠️ **BYTT** | Kjente sårbarheter, vurder `pdfjs-dist` |
| `@anthropic-ai/sdk@0.71.2` | ✅ OK | Nylig versjon |
| `@supabase/ssr@0.5.2` | ✅ OK | |
| `@upstash/ratelimit@2.0.7` | ✅ OK | |
| `zod@4.3.5` | ⚠️ Sjekk | Zod 4 er pre-release, vurder 3.x for stabilitet |
| `tailwindcss@3.4.19` | ⚠️ Vurder | v4 er ute, men ikke kritisk |

### 7.2 tsconfig.json — Anbefalte tillegg

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 7.3 Secrets-sjekk

- ✅ `.env*` er i `.gitignore`
- ✅ Ingen hardkodede API-nøkler funnet i kildekode
- ✅ Service role key brukes kun server-side i `src/app/api/upload/route.ts`

---

## 8. PILOT "DEFINITION OF DONE" — SJEKKLISTE

### Sikkerhet

- [ ] Fjern token fra localStorage i invite-flow
- [ ] Legg til magic bytes validering på fil-upload
- [ ] Bytt ut pdf-parse med sikrere alternativ
- [ ] Implementer CSP headers i next.config.ts
- [ ] Legg til storage INSERT/DELETE deny-policies

### Kvalitet

- [ ] Rate limit bruker user-ID for auth requests
- [ ] Union types for role/severity/status
- [ ] Server-side paginering på audit-logs og read-confirmations
- [ ] Error boundary med Sentry-integrasjon

### UX/DX

- [ ] Splitt EmployeeApp.tsx til < 500 linjer
- [ ] Dokumenter env-variabler i README
- [ ] Legg til health-check endpoint (`/api/health`)

### Deployment

- [ ] Verifiser Upstash Redis er konfigurert i prod
- [ ] Sett opp database backups i Supabase
- [ ] Test invite-flow end-to-end i staging
- [ ] Verifiser RLS policies i prod med test-bruker fra hver rolle

---

## 9. ANBEFALT ROADMAP

### Uke 1-2: Sikkerhet & Kritiske fixes

| Dag | Oppgave |
|-----|---------|
| 1-2 | PATCH 1, 2, 5 (token, file validation, headers) |
| 3 | Bytt pdf-parse, oppdater til Zod 3.x |
| 4-5 | PATCH 3, 4 (types, rate limit) |
| 6-7 | Storage policies, paginering på audit-logs |

### Uke 3-4: Kvalitet & Skalering

| Dag | Oppgave |
|-----|---------|
| 8-10 | Splitt mega-komponenter |
| 11-12 | Sentry-integrasjon, strukturert logging |
| 13-14 | End-to-end testing, pilot dry-run |

### 1 måned: Pilot-ready

- Alle "MÅ" og "BØR" items lukket
- Minimum 1 uke med intern bruk uten kritiske bugs
- Dokumentasjon for onboarding av pilot-kunde
- Runbook for vanlige support-scenarioer

---

## 10. FILSTRUKTUR-OVERSIKT

```
tetra/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   │   ├── hooks/       # 7 custom hooks
│   │   │   ├── tabs/        # 9 tab components
│   │   │   ├── components/  # Modals
│   │   │   └── ...
│   │   ├── employee/        # Employee app
│   │   │   ├── hooks/       # 2 custom hooks
│   │   │   └── ...
│   │   ├── leader/          # Teamleader dashboard
│   │   ├── login/           # Login page
│   │   ├── auth/callback/   # Auth callback
│   │   ├── invite/[token]/  # Invite flow
│   │   ├── post-auth/       # Role routing
│   │   └── api/             # API routes
│   │       ├── ask/         # AI endpoint
│   │       ├── upload/      # File upload
│   │       ├── confirm-read/
│   │       ├── audit-logs/
│   │       └── read-confirmations/
│   ├── components/          # Shared components (4)
│   └── lib/                 # Utilities
│       ├── supabase/        # Supabase clients
│       └── ...
├── supabase/
│   └── sql/                 # 17 migration files
├── types/                   # Type declarations
└── [config files]
```

---

## 11. KONKLUSJON

Codebase er godt strukturert for en MVP. De kritiske security-funnene (MÅ 1-3) bør fikses før pilot. 

**Estimert arbeid:** 5-7 utviklerdager for pilot-readiness.

**Styrker:**
- God RLS-implementasjon i Supabase
- Ryddig hook-basert arkitektur i admin
- Rate limiting på plass med fallback
- Audit logging implementert

**Svakheter:**
- Mega-komponenter som trenger splitting
- Manglende paginering vil skalere dårlig
- Ingen strukturert error tracking

---

*Rapport generert av Claude Opus AI Code Review*
