# TETRA CODEBASE REVIEW — SAMLET RAPPORT

**Dato:** 13. januar 2026
**Sist oppdatert:** 13. januar 2026
**Versjon:** 0.1.0
**Status:** Pilot-ready ~92%

---

## 1. EXECUTIVE SUMMARY

Tetra er en solid HMS-plattform bygget på Next.js 16 og Supabase med god sikkerhetsarkitektur. De fleste kritiske sikkerhetsfunn fra tidligere gjennomganger er nå fikset.

### Hva er bra
- ✅ Sikker invite-flow (sessionStorage, ikke localStorage)
- ✅ Magic bytes-validering på filopplasting
- ✅ Byttet fra sårbar pdf-parse til pdfjs-dist
- ✅ Rate limiting per bruker-ID (ikke bare IP)
- ✅ Comprehensive CSP og security headers
- ✅ RLS-policies godt implementert
- ✅ Nytt premium designsystem med petrol-fargepalett

### Gjenstående arbeid
- ⚠️ Manglende server-side paginering (P1)
- ⚠️ Union types i types.ts (P2)
- ⚠️ Storage INSERT/DELETE policies (P2)
- ⚠️ Ingen automatiserte tester (P2)
- ⚠️ Ingen CI/CD pipeline (P2)

**Estimert gjenstående arbeid:** 3-5 utviklerdager for full pilot-readiness.

---

## 2. ARKITEKTUR-OVERSIKT

### 2.1 Tech Stack
| Komponent | Teknologi | Versjon |
|-----------|-----------|---------|
| Frontend | Next.js (App Router) | 16.1.1 |
| Backend | Supabase (PostgreSQL, Auth, Storage) | - |
| AI | Anthropic Claude 3.5 Haiku | - |
| Rate Limiting | Upstash Redis | 2.0.7 |
| Styling | Tailwind CSS + Custom Design System | 3.4.19 |
| Validering | Zod | 4.3.5 |
| PDF | pdfjs-dist | 5.4.530 |

### 2.2 Routes/Pages

| Route | Funksjon | Tilgangskontroll |
|-------|----------|------------------|
| `/login` | Magic link + Azure SSO | Public |
| `/auth/callback` | PKCE/OTP exchange | Public |
| `/invite/[token]` | Invite-aksept flow | Public (token-validert) |
| `/post-auth` | Role-basert redirect | Authenticated |
| `/admin` | Admin dashboard (9 tabs) | role=admin |
| `/leader` | Teamleder dashboard | role=teamleader |
| `/employee` | Ansatt-app med AI-chat | role=employee |

### 2.3 API Routes

| Endpoint | Funksjon | Sikkerhet |
|----------|----------|-----------|
| `/api/upload` | PDF/fil upload | Auth + Admin + Rate limit + Magic bytes |
| `/api/ask` | AI-spørsmål (Anthropic) | Auth + Rate limit + Org-validering |
| `/api/confirm-read` | Lesebekreftelse | Auth + Zod + Org-validering |
| `/api/audit-logs` | Aktivitetslogg | Auth + Admin-sjekk |
| `/api/read-confirmations` | Leserapport | Auth + Admin-sjekk |

### 2.4 Database-tabeller

```
organizations          — Bedrifter/organisasjoner
├── teams              — Team innenfor organisasjoner
├── profiles           — Brukerprofiler (extends auth.users)
├── folders            — Mapper for instrukser
├── instructions       — HMS-instrukser
│   ├── instruction_teams    — Many-to-many: instruks ↔ team
│   └── instruction_reads    — Lesebekreftelser
├── alerts             — Varsler/avvik
│   └── alert_teams          — Many-to-many: varsel ↔ team
├── invites            — Invitasjoner
├── audit_logs         — Aktivitetslogg
├── ask_tetra_logs     — AI-spørsmål logg
└── ai_unanswered_questions  — Ubesvarte AI-spørsmål
```

### 2.5 Filstruktur

```
tetra/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   │   ├── hooks/       # 7 custom hooks
│   │   │   ├── tabs/        # 9 tab components
│   │   │   ├── components/  # Modals
│   │   │   └── styles.ts    # Design system
│   │   ├── employee/        # Employee app
│   │   │   └── hooks/       # 2 custom hooks
│   │   ├── leader/          # Teamleader dashboard
│   │   ├── login/           # Login page
│   │   ├── invite/[token]/  # Invite flow
│   │   └── api/             # API routes
│   ├── components/          # Shared components (4)
│   └── lib/                 # Utilities
│       ├── supabase/        # Supabase clients
│       ├── ui-helpers.ts    # Design tokens & helpers
│       └── ratelimit.ts     # Rate limiting
├── supabase/sql/            # 17 migration files
└── [config files]
```

---

## 3. SIKKERHETSSTATUS

### 3.1 Fikset (Tidligere kritiske funn)

| ID | Problem | Status | Løsning |
|----|---------|--------|---------|
| MÅ-1 | Invite-token i localStorage | ✅ Fikset | Bruker nå sessionStorage kun for navn |
| MÅ-2 | Manglende MIME-validering | ✅ Fikset | Magic bytes-validering implementert |
| MÅ-3 | Sårbar pdf-parse v1.1.1 | ✅ Fikset | Byttet til pdfjs-dist v5.4.530 |
| MÅ-4 | Rate limit kun på IP | ✅ Fikset | Bruker nå `user:${user.id}` |
| BØR-5 | Tom next.config.ts | ✅ Fikset | Full security headers + CSP |

### 3.2 Gjenstående sikkerhetsfunn

| ID | Problem | Prioritet | Risiko |
|----|---------|-----------|--------|
| SEC-1 | Storage INSERT/DELETE policies mangler | P2 | Medium |
| SEC-2 | `unsafe-inline` i CSP | P2 | Medium |
| SEC-3 | Signed URL med 1 time utløp | P3 | Lav |
| SEC-4 | Ingen domenevalidering på invite | P3 | Lav |

---

## 4. GJENSTÅENDE FUNN — PRIORITERT LISTE

### 4.1 Høy prioritet (P1) — Må fikses for skalering

#### F-001: Ingen server-side paginering på admin-rapporter
**Filer:**
- `src/app/api/read-confirmations/route.ts` — Henter ALLE instrukser, brukere og bekreftelser
- `src/app/api/audit-logs/route.ts` — Har `limit` men ingen `offset`

**Problem:** Ved 1000+ brukere/instrukser vil admin-dashboard bli ubrukelig tregt. Read-confirmations bygger en full matrise i minnet.

**Løsning:**
```typescript
// Legg til query params
const page = parseInt(searchParams.get('page') || '1')
const limit = parseInt(searchParams.get('limit') || '50')
const offset = (page - 1) * limit

// Bruk Supabase range()
const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .range(offset, offset + limit - 1)
```

**Estimat:** 2-3 timer

---

#### F-002: Ubegrensede lister hentes client-side
**Filer:**
- `src/app/admin/hooks/useAdminUsers.ts`
- `src/app/admin/hooks/useAdminInstructions.ts`
- `src/app/admin/hooks/useAdminTeams.ts`

**Problem:** Hooks henter hele tabeller og filtrerer i minnet. Eksponerer mer data enn nødvendig.

**Løsning:** Implementer API-endepunkter med søk og paginering.

**Estimat:** 3-4 timer

---

### 4.2 Middels prioritet (P2) — Bør fikses før pilot

#### F-003: Types bruker `string` i stedet for union types
**Fil:** `src/lib/types.ts`

**Nåværende:**
```typescript
role: string
severity: string
status: string
```

**Anbefalt:**
```typescript
export type Role = 'admin' | 'teamleader' | 'employee'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type InstructionStatus = 'draft' | 'published' | 'archived'

export type Profile = {
  id: string
  full_name: string
  email?: string | null
  role: Role  // <-- Union type
  org_id: string
  team_id: string | null
}
```

**Estimat:** 30 minutter

---

#### F-004: Storage INSERT/DELETE policies mangler
**Fil:** `supabase/sql/07_storage_policies.sql`

**Problem:** Kun SELECT policy definert. Brukere kan potensielt slette andres filer via direkte storage API.

**Løsning:**
```sql
-- Blokkér INSERT/UPDATE/DELETE for authenticated users
create policy "Block direct uploads"
  on storage.objects for insert
  to authenticated
  with check (false);

create policy "Block direct deletes"
  on storage.objects for delete
  to authenticated
  using (false);
```

**Estimat:** 15 minutter

---

#### F-005: `unsafe-inline` i CSP
**Fil:** `next.config.ts:19`

**Problem:** Tillater inline scripts/styles, svekker XSS-beskyttelse.

**Løsning:** Migrer til nonce-basert CSP med Next.js' innebygde støtte.

**Estimat:** 1-2 timer

---

#### F-006: Ingen automatiserte tester
**Problem:** Ingen unit, integration eller e2e tester. Kritiske flyter (invite, upload, AI) er komplekse.

**Løsning:**
- Jest + Testing Library for unit tests
- Playwright/Cypress for e2e
- Dekk API routes, RLS og UI flows

**Estimat:** 2-3 dager for grunnleggende dekning

---

#### F-007: Ingen CI/CD pipeline
**Problem:** Ingen GitHub Actions. Kvalitetssjekker avhenger av manuell kjøring.

**Løsning:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
```

**Estimat:** 30 minutter

---

### 4.3 Lav prioritet (P3) — Kan forbedres

#### F-008: Monolittiske UI-komponenter
**Filer:**
- `src/app/employee/EmployeeApp.tsx` — 1037 linjer
- `src/app/admin/AdminDashboard.tsx` — 530 linjer

**Problem:** Store komponenter er vanskelige å vedlikeholde og teste.

**Løsning:** Splitt til mindre komponenter (ChatPanel, InstructionList, AlertList, etc.)

---

#### F-009: Duplikat data i chat request
**Fil:** `src/app/employee/hooks/useEmployeeChat.ts`

**Problem:** Sender `orgId` og `userId` i request body, men server ignorerer disse og bruker session.

**Løsning:** Fjern unødvendige felter fra request.

---

#### F-010: Signed URL med 1 time utløp
**Fil:** `src/components/FileLink.tsx:27`

**Problem:** `createSignedUrl(fileUrl, 3600)` - URL kan deles i 1 time.

**Løsning:** Reduser til 300 sekunder (5 min) og vurder proxy via API route.

---

#### F-011: Potensiell DoS via PDF-parsing
**Fil:** `src/app/api/upload/route.ts`

**Problem:** Store/ondskapsfulle PDF-er kan konsumere minne og CPU.

**Løsning:** Sett maks sidantall og byte-størrelse. Vurder bakgrunnsarbeider.

---

#### F-012: Manglende domenevalidering på invite
**Fil:** `src/app/invite/[token]/AcceptInvite.tsx`

**Problem:** Ingen sjekk på at e-post tilhører riktig organisasjon.

**Løsning:** Valider e-postdomene mot tillatt liste ved opprettelse av invite.

---

## 5. HVA SOM ER BRA

### Sikkerhet
- ✅ Sterke security headers i next.config.ts (CSP, X-Frame-Options, etc.)
- ✅ RLS enforced på alle Supabase-tabeller
- ✅ Security-definer funksjoner sjekker auth.uid()
- ✅ Service role key brukes kun server-side
- ✅ Magic bytes-validering på filopplasting
- ✅ Per-bruker rate limiting med Upstash
- ✅ Zod-validering på API input
- ✅ Sikker invite-flow uten sensitive data i storage

### Arkitektur
- ✅ Ryddig hook-basert arkitektur i admin
- ✅ Logisk rolle-basert routing
- ✅ Audit logging implementert
- ✅ Graceful fallback for manglende env-variabler

### Kode & DX
- ✅ Konsistent designsystem (ui-helpers.ts)
- ✅ Lesbare SQL-migrasjoner
- ✅ Spell-checking og linting scripts
- ✅ Keyword extraction og relevans-scoring for AI

### Nylig forbedret
- ✅ Premium Nordic Enterprise design (petrol/teal)
- ✅ Plus Jakarta Sans typografi
- ✅ Glassmorfisme-effekter
- ✅ Forbedrede hover-states og animasjoner

---

## 6. QUICK WINS (~2 timer totalt)

| # | Oppgave | Tid | Prioritet |
|---|---------|-----|-----------|
| 1 | Union types i types.ts | 30 min | P2 |
| 2 | Storage INSERT/DELETE policies | 15 min | P2 |
| 3 | GitHub Actions CI workflow | 30 min | P2 |
| 4 | Kortere signed URL (300s) | 5 min | P3 |
| 5 | Fjern orgId/userId fra chat request | 10 min | P3 |
| 6 | Strengere tsconfig | 15 min | P3 |

---

## 7. ANBEFALT ROADMAP

### Fase 1: Quick Wins (1 dag)
- [ ] Implementer union types
- [ ] Legg til storage policies
- [ ] Sett opp GitHub Actions CI
- [ ] Kortere signed URL

### Fase 2: Paginering (2-3 dager)
- [ ] Server-side paginering på read-confirmations
- [ ] Server-side paginering på audit-logs
- [ ] Paginerte admin hooks

### Fase 3: Kvalitet (3-5 dager)
- [ ] Nonce-basert CSP
- [ ] Grunnleggende test-suite (Jest)
- [ ] E2E-tester for kritiske flyter
- [ ] Splitt store komponenter

### Fase 4: Pilot-forberedelse
- [ ] Dokumenter deployment i README
- [ ] Health-check endpoint
- [ ] Runbook for support-scenarioer
- [ ] 1 uke intern testing

---

## 8. PILOT DEFINITION OF DONE

### Må være på plass
- [x] Sikker invite-flow
- [x] Magic bytes-validering
- [x] Sikker PDF-parsing (pdfjs-dist)
- [x] Rate limiting per bruker
- [x] CSP headers
- [ ] Union types
- [ ] Storage policies
- [ ] Server-side paginering

### Bør være på plass
- [ ] CI/CD pipeline
- [ ] Grunnleggende tester
- [ ] Nonce-basert CSP
- [ ] Dokumentasjon

### Kan vente til etter pilot
- [ ] Komponent-splitting
- [ ] Full test-dekning
- [ ] Domenevalidering på invite

---

## 9. KONKLUSJON

Tetra har gjort betydelig fremgang siden forrige gjennomgang. De fleste kritiske sikkerhetsfunn er fikset, og kodebasen er godt strukturert.

**Hovedfokus nå bør være:**
1. Paginering for skalerbarhet
2. Union types for typesikkerhet
3. CI/CD for kvalitetssikring

**Pilot-readiness:** ~92% → 100% med 3-5 dagers arbeid

---

*Rapport generert og oppdatert 13. januar 2026*
