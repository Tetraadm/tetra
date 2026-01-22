# Pilot Readiness Audit (Release Hardening)

Date: 2026-01-22
Repo: tetra (Next.js)
Branch: main (local ahead of origin/main by 3 at time of audit)
Auditor: release-hardening/QA pass (evidence-based; conservative)

This document captures a pilot-readiness audit of the repository with concrete evidence (paths) and a prioritized fix plan. UI language requirement: Norwegian Bokmål (no mixed-language UI strings).

---

## 1) System Map

### Entrypoints
- App root layout: `src/app/layout.tsx`
- Auth middleware: `src/middleware.ts`
- Error boundaries: `src/app/error.tsx`, `src/app/global-error.tsx`

### Routing
- Public route group: `src/app/(public)`
  - `/` redirects to `/login`: `src/app/(public)/page.tsx`
  - `/login`: `src/app/(public)/login/page.tsx`
  - `/invite/[token]`: `src/app/(public)/invite/[token]/page.tsx`
  - `/auth/callback`: `src/app/(public)/auth/callback/route.ts`
- Authenticated route group: `src/app/(platform)`
  - `/post-auth`: `src/app/(platform)/post-auth/page.tsx`
  - `/portal`: `src/app/(platform)/portal/page.tsx`
  - `/instructions/admin|leader|employee`: `src/app/(platform)/instructions/*/page.tsx`

### APIs
- Health: `src/app/api/health/route.ts`
- AI Q&A: `src/app/api/ask/route.ts`
- Upload: `src/app/api/upload/route.ts`
- Invite: `src/app/api/invite/route.ts`
- Confirm read: `src/app/api/confirm-read/route.ts`
- Audit log: `src/app/api/audit/route.ts`, `src/app/api/audit-logs/route.ts`
- Read confirmations: `src/app/api/read-confirmations/route.ts`
- GDPR: `src/app/api/gdpr-request/route.ts`, `src/app/api/gdpr-export/route.ts`, `src/app/api/gdpr-cleanup/route.ts`
- Contact form: `src/app/api/contact/route.ts`

### External services
- Supabase (DB/Auth/Storage): `src/lib/supabase/*`, schema/policies in `supabase/sql/consolidated/*`
- Anthropic + optional OpenAI embeddings: `src/app/api/ask/route.ts`, `src/lib/embeddings.ts`
- Resend email: `src/app/api/invite/route.ts`, `src/app/api/contact/route.ts`
- Upstash rate limiting (fail-closed in prod): `src/lib/ratelimit.ts`
- Sentry: `sentry.*.config.ts`, `src/instrumentation.ts`

### Critical user journeys (pilot)
- Invite onboarding: `/invite/[token]` -> OTP email -> `/invite/[token]/callback` -> `/post-auth`
- Login: `/login` -> Supabase auth -> `/post-auth` -> role routing
- Employee: view instructions -> open PDF -> confirm read -> ask AI
- Admin: create/upload instruction + team mapping -> publish/unpublish -> manage users/teams -> audit + read report -> GDPR requests

---

## 2) Pilot Readiness Report

Legend: BLOCKER = release gate / pilot stopper.

Severity | Area | Issue | Evidence (paths) | User impact | Fix approach
---|---|---|---|---|---
BLOCKER | Build/CI | Build + typecheck fail due to missing Radix UI deps | `src/components/ui/checkbox.tsx:4`, `src/components/ui/label.tsx:4`, `src/components/ui/progress.tsx:4`, `src/components/ui/select.tsx:4`, `src/components/ui/dialog.tsx:4`, `package.json` | App cannot build/deploy; pilot cannot run | Add missing deps (`@radix-ui/react-checkbox`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-select`, `@radix-ui/react-dialog`) OR remove these components + refactor usage (deps is lowest risk)
BLOCKER | Build/CI | ESLint fails (CI gate) | Lint errors: `scripts/*.js` require imports; unused vars in `src/app/(platform)/instructions/admin/tabs/InsightsTab.tsx`, `src/app/(platform)/instructions/admin/tabs/OverviewTab.tsx`, `src/app/(platform)/instructions/admin/tabs/ReadConfirmationsTab.tsx`, `src/app/(platform)/instructions/employee/EmployeeApp.tsx`, `src/app/api/ask/route.ts` | CI fails; prevents safe release | Ignore `scripts/**` in ESLint (or convert scripts to ESM) + remove unused imports/vars
BLOCKER | Auth | Login flow mismatch (password login) vs invite flow/docs/tests (OTP magic link) | `src/app/(public)/login/page.tsx:50` (password), `src/app/(public)/invite/[token]/AcceptInvite.tsx:43` (OTP), `docs/HVORDAN_TETRIVO_FUNGERER.md:204-207` ("Ingen passord"), `tests/e2e/login.spec.ts` (expects magic link) | Invited users can be unable to log in later; pilot onboarding breaks | Choose one auth model and align UI + tests + docs. Recommended: implement OTP/magic link on `/login` as primary
BLOCKER | Routing | Role-based redirects point to non-existent routes | `src/app/(platform)/instructions/admin/page.tsx:31-34` redirects to `/leader`/`/employee`; `src/app/(platform)/instructions/leader/page.tsx:26-29` redirects to `/admin`/`/employee` | Users hit 404 depending on role/URL; support load; pilot confusion | Redirect to `/instructions/*` or centralize via `/post-auth`
BLOCKER | Jobs/Release | GDPR cleanup cron endpoint blocked by auth middleware | `src/middleware.ts:32-38` (public allowlist omits `/api/gdpr-cleanup`), `.github/workflows/gdpr-cleanup.yml`, `src/app/api/gdpr-cleanup/route.ts` | Monthly GDPR cleanup fails; compliance gate broken | Allow `/api/gdpr-cleanup` as public route in middleware; keep Bearer secret check in handler
BLOCKER | DB schema | `deleted_at` referenced but not defined in schema | `supabase/sql/consolidated/02_schema.sql` (no deleted_at), but used in `supabase/sql/consolidated/08_vector_fix.sql:58`, `supabase/sql/consolidated/09_read_confirmations_rpc.sql:31`, app writes `deleted_at` in `src/app/api/upload/route.ts:329`, `src/app/(platform)/instructions/admin/hooks/useAdminInstructions.ts:113` | Runtime SQL errors + broken "soft delete" semantics | Add `deleted_at TIMESTAMPTZ` to relevant tables (min: `instructions`; likely also `folders`, `alerts` to match code). Re-run migrations
BLOCKER | Security/AuthZ | RLS for `instructions` does not enforce team scoping (org-wide SELECT) | `supabase/sql/consolidated/05_policies.sql:176-181` | Any org user can query all published instructions (and file_path) in browser via Supabase; cross-team leakage | Update RLS policies to implement the same team/assignment semantics as `get_user_instructions()` (team mapping or org-wide only when no mappings)
BLOCKER | Security/AuthZ | Storage read policy is org-level only; combined with broad instruction SELECT leaks team-restricted PDFs | `supabase/sql/consolidated/06_storage.sql:45-55`, `supabase/sql/consolidated/05_policies.sql:176-181`, `src/components/FileLink.tsx:26` (signed URL) | Team-restricted instruction PDFs can be accessed by other org members | Tighten storage SELECT policy: require that `storage.objects.name` matches `instructions.file_path` for an instruction the user is allowed to access via team mapping
BLOCKER | Security/AuthZ | Vector/hybrid search RPCs lack caller verification and team scoping; `match_instructions` uses org of arbitrary `p_user_id` | `supabase/sql/consolidated/08_vector_fix.sql:40-45`, `supabase/sql/consolidated/09_instruction_chunks.sql:89-105` | Potential instruction leakage through RPC by passing another user's id | Add `IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'forbidden'; END IF;` + enforce team access; explicitly revoke public exec and grant only required roles
BLOCKER | Backend/AuthZ | Read-confirmations RPC perms conflict with API usage (service_role-only) | `supabase/sql/consolidated/09_read_confirmations_rpc.sql:180-193` (REVOKE authenticated), while API uses anon/authenticated client: `src/app/api/read-confirmations/route.ts:74` | Admin read confirmations can 500 in prod | Grant execute to authenticated (admin checks already exist) OR update API to use service_role (prefer grant)
BLOCKER | Language | English user-facing validation strings in upload API response | `src/app/api/upload/route.ts:18-23` | Mixed language UI (release blocker) | Translate validation messages to Bokmål; ensure API never returns raw English messages to UI
HIGH | UX correctness | Login page contains multiple dead-end links/buttons (`#`) and misleading CTAs ("Registrer deg" -> `/` -> `/login`) | `src/app/(public)/login/page.tsx` | Users click non-functional actions in pilot; reduces trust | Hide/disable or implement; at minimum remove `href="#"` links or replace with Bokmål explanatory dialogs
HIGH | Privacy | PII logged to server console (email) | `src/app/(platform)/post-auth/page.tsx:25` | PII in logs; support/legal risk | Remove or mask email; keep userId only
HIGH | Data integrity | Confirm-read endpoint validates org only (not team access) | `src/app/api/confirm-read/route.ts:38-48` | A user could confirm reads for instructions they should not access (if IDs leak) | Validate instruction accessibility using the same team/assignment semantics as UI
HIGH | Release safety | E2E suite cannot currently run (dev server lock/port) and tests appear outdated vs current routes | `npm run test:e2e` output (Next lock error), plus `tests/e2e/navigation.spec.ts` expects landing page on `/` | No reliable end-to-end regression gate before pilot | Fix dev server start for Playwright; update tests to real routing/auth model
MEDIUM | Language | Raw `error.message` is surfaced to users in multiple places (can be English/technical) | `src/app/(public)/login/page.tsx:59`, `src/app/(public)/invite/[token]/AcceptInvite.tsx:51`, `src/components/FileLink.tsx:37`, `src/components/GdprDataExport.tsx:43`, `src/components/GdprDeleteRequest.tsx:38` | Mixed-language UI and potential leakage of internal error details | Map known errors to Bokmål; show generic Bokmål fallback; keep details in console only in dev
MEDIUM | Seed data | Pilot seed uses invalid severity values (`high`) and inconsistent audit action types | `supabase/sql/seed/pilot_seed_data.sql:83-85`, schema constraints: `supabase/sql/consolidated/02_schema.sql:64` | Seed script fails; slows pilot setup | Update seed severities to valid enum (`low|medium|critical`) and align audit log action_type format
LOW | Security headers | CSP includes `unsafe-inline` for scripts/styles (known tradeoff) | `next.config.ts:18-49` | Not a pilot stopper, but reduces XSS protection | Keep for pilot; plan nonce-based CSP later
LOW | Tooling | Next warning: middleware convention deprecated | `npm run build` output; `src/middleware.ts` | Future tech debt | Track as follow-up; not required for pilot

---

## 3) Language Audit (Norwegian Bokmål)

No dedicated i18n framework detected (no `next-intl`, `i18next`, etc.). Language compliance therefore depends on:
- avoiding raw third-party error messages reaching UI
- scanning/standardizing UI strings

### Non-Bokmål or risky user-facing strings

1) Upload API Zod messages are English and can be returned to UI
- Found: `src/app/api/upload/route.ts:18-23`
- Current -> Proposed Bokmål:
  - "File is required" -> "Fil er påkrevd"
  - "Title is required" -> "Tittel er påkrevd"
  - "Title too long" -> "Tittelen er for lang"
  - "Content too long" -> "Innholdet er for langt"
  - "Invalid organization ID" -> "Ugyldig organisasjons-ID"

2) Raw `error.message` shown to users (can be English/technical)
- `src/app/(public)/login/page.tsx:59` -> replace with Bokmål mapping (do not show raw error)
- `src/app/(public)/invite/[token]/AcceptInvite.tsx:51` -> replace with Bokmål generic failure + retry guidance
- `src/components/FileLink.tsx:37-39` -> replace with Bokmål generic failure
- `src/components/GdprDataExport.tsx:43`, `src/components/GdprDeleteRequest.tsx:38`, `src/components/GdprRequestsAdmin.tsx:81` -> Bokmål generic failure

3) Invite email displays raw role values (not Bokmål)
- Found: `src/lib/emails/invite-email.ts:72` uses `${role}`
- Proposed: map role -> Bokmål label (same terminology as `src/lib/ui-helpers.ts:75-81`)
  - `admin` -> `Sikkerhetsansvarlig`
  - `teamleader` -> `Teamleder`
  - `employee` -> `Ansatt`

---

## 4) Fix Plan (prioritized, small commits)

Note: keep diffs small; do not add new libraries unless required for a BLOCKER fix.

### PR/Commit 1 (BLOCKER): Restore build/typecheck
- Proposed commit message: `fix(build): restore missing Radix UI dependencies`
- Add required Radix packages to `package.json` and ensure lockfile updates
- Re-run: `npm run typecheck` and `npm run build`

### PR/Commit 2 (BLOCKER): Make CI lint pass
- Proposed commit message: `chore(lint): ignore scripts and remove unused vars`
- Option A (lowest risk): ignore `scripts/**` in ESLint config
- Fix unused imports/vars flagged by ESLint:
  - `src/app/(platform)/instructions/admin/tabs/InsightsTab.tsx`
  - `src/app/(platform)/instructions/admin/tabs/OverviewTab.tsx`
  - `src/app/(platform)/instructions/admin/tabs/ReadConfirmationsTab.tsx`
  - `src/app/(platform)/instructions/employee/EmployeeApp.tsx`
  - `src/app/api/ask/route.ts` (remove `fullAnswer`)

### PR/Commit 3 (BLOCKER): Fix broken redirects
- Proposed commit message: `fix(routing): correct role redirects to instructions dashboards`
- Fix redirect targets in:
  - `src/app/(platform)/instructions/admin/page.tsx`
  - `src/app/(platform)/instructions/leader/page.tsx`

### PR/Commit 4 (BLOCKER): Unblock GDPR cleanup cron
- Proposed commit message: `fix(middleware): allow gdpr-cleanup endpoint without session`
- Add `/api/gdpr-cleanup` to public allowlist in `src/middleware.ts`

### PR/Commit 5 (BLOCKER): Fix DB schema mismatch + soft delete consistency
- Proposed commit message: `fix(db): add deleted_at columns and align queries`
- Add `deleted_at TIMESTAMPTZ` to tables referenced by code/SQL (`instructions` at minimum)
- Ensure all functions/queries referencing `deleted_at` are consistent

### PR/Commit 6 (BLOCKER): Close team-scope data leakage (RLS + storage)
- Proposed commit message: `fix(security): enforce team scoping in RLS and storage`
- Update RLS policies for:
  - `public.instructions` SELECT (team mapping aware)
  - `public.alerts` SELECT (team mapping aware)
  - `public.instruction_chunks` SELECT (team mapping aware)
- Update storage.objects SELECT policy for bucket `instructions` to require access to instruction matching `file_path`
- Add manual regression steps for employee access boundaries

### PR/Commit 7 (BLOCKER): Harden search RPCs
- Proposed commit message: `fix(security): harden vector/hybrid search RPC access checks`
- For `match_instructions` and `match_chunks_hybrid`:
  - Require `auth.uid() = p_user_id`
  - Enforce team access (same semantics as `get_user_instructions`)
  - Explicit GRANT/REVOKE to prevent PUBLIC use

### PR/Commit 8 (BLOCKER): Fix read-confirmations RPC execution perms
- Proposed commit message: `fix(db): grant read confirmations RPCs to authenticated admins`
- Adjust `supabase/sql/consolidated/09_read_confirmations_rpc.sql` grants to match API usage

### PR/Commit 9 (BLOCKER): Language compliance pass
- Proposed commit message: `fix(lang): ensure Bokmål user-facing errors and emails`
- Translate upload validation messages and eliminate raw error passthrough
- Map auth errors and general network errors to Bokmål
- Translate invite email role labels

### PR/Commit 10 (HIGH): UX cleanup on login
- Proposed commit message: `fix(login): remove dead links and clarify pilot login method`
- Remove/replace `href="#"` links, disable non-implemented providers/SSO, avoid misleading "Registrer deg" CTA

### PR/Commit 11 (MEDIUM): Seed-data correctness
- Proposed commit message: `fix(seed): align pilot seed data with schema`
- Update severities + audit action names in `supabase/sql/seed/pilot_seed_data.sql`

---

## 5) Verification Steps

### Commands actually run (2026-01-22)
- `npm run lint` (FAILED)
  - `scripts/*.js`: `@typescript-eslint/no-require-imports`
  - unused vars (see table above)
- `npm run typecheck` (FAILED)
  - Missing modules: `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`, `@radix-ui/react-label`, `@radix-ui/react-progress`, `@radix-ui/react-select`
- `npm run test` (PASSED) -> 7 files / 67 tests
- `npm run build` (FAILED)
  - Turbopack module-not-found for missing Radix packages
- `npm audit --audit-level=high` (PASSED) -> 0 vulnerabilities
- `npm run test:e2e` (FAILED)
  - Could not start Next dev server: port already in use + `.next/dev/lock` present

### Manual pilot checklist (post-fix)
1) Invite onboarding: `/invite/<token>` -> receive OTP/magic link -> callback -> routed to correct dashboard
2) Login: `/login` works for invited users; error states are Bokmål; no raw technical messages
3) Employee: instruction list only shows team-allowed docs; cannot access other-team docs via direct Supabase query
4) Employee: open PDF attachment via signed URL (storage policy enforced)
5) Confirm read: only allowed for accessible instructions
6) Admin: create instruction with team mapping; publish/unpublish; edit mappings without widening scope accidentally
7) Admin: read confirmations report loads (no 500) and shows user detail rows
8) GDPR cleanup: GitHub Actions cron can call `/api/gdpr-cleanup` without redirect and returns 200

---

## 6) Known Risks / Not fixed (in this audit pass)

- No fixes were applied in this document; it is an audit + plan only.
- Supabase schema/policies changes are high-risk; apply with staging verification and explicit rollback plan.
- Auth decision (OTP vs password) materially affects onboarding UX; must be decided before implementation.
- Playwright E2E is currently blocked by local dev server lock and likely out-of-date with current routing/auth; treat as a follow-up gate once build is restored.
