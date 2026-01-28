# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tetrivo is a Norwegian HMS (workplace safety) SaaS platform with AI-powered document management, read confirmations, and compliance tracking. All UI text must be in **Norwegian Bokmål**.

**Tech Stack:** Next.js 16.1, React 19, TypeScript 5, Supabase (PostgreSQL), Vertex AI (Gemini 2.0 Flash + embeddings), TailwindCSS 4

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check
npm run test         # Unit tests (Vitest)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # E2E tests (Playwright)
npm run spellcheck   # Spell check
```

**Run single test file:**
```bash
npx vitest run tests/unit/path/to/file.test.ts
npx playwright test tests/e2e/path/to/file.spec.ts
```

**Deploy Supabase Edge Functions:**
```bash
supabase functions deploy generate-embeddings
supabase functions deploy process-document
```

**Security audits:**
```bash
npm audit                # Check for vulnerabilities
npm audit fix            # Auto-fix where possible
```

## Architecture

### Route Groups (Next.js App Router)
- `src/app/(public)/` - Unauthenticated: landing, login, invite flow
- `src/app/(platform)/` - Authenticated: admin/employee/leader dashboards
- `src/app/api/` - API routes

### Role-Based UIs
Three separate interfaces based on user role (stored in `profiles.role`):
- **Admin** (`/instructions/admin`) - Full org management, users, teams, instructions
- **Teamleader** (`/instructions/leader`) - Team-scoped management
- **Employee** (`/instructions/employee`) - Read instructions, AI chat

Post-login routing handled by `/post-auth` which redirects based on role.

### Authentication Pattern
- **Browser:** `createBrowserClient()` from `src/lib/supabase/client.ts`
- **Server Components/API:** `createServerClient()` from `src/lib/supabase/server.ts`
- **Admin Operations:** `createSupabaseClient()` with service role (API routes only, after auth check)
- **Middleware:** `src/middleware.ts` enforces auth, refreshes sessions

### Database Access Pattern
Use security-definer RPC functions for complex queries:
- `get_user_instructions(p_user_id)` - Instructions user can access
- `get_user_alerts(p_user_id)` - Alerts for user
- `match_chunks_hybrid()` - Hybrid vector + full-text search

RLS policies enforce org/team boundaries. Service role bypasses RLS after explicit auth checks.

### AI/Search Pipeline
Search follows priority order with fallbacks:
1. Vertex AI Search (external data store)
2. Hybrid search (vector + full-text via `match_chunks_hybrid` RPC)
3. Keyword search (TF-IDF)

Key files:
- `src/lib/vertex-chat.ts` - Gemini streaming/non-streaming
- `src/lib/embeddings.ts` - Vector embedding generation
- `src/lib/keyword-extraction.ts` - TF-IDF keyword analysis
- `src/lib/chunking.ts` - Text splitting for embeddings

### Component Organization
- `src/components/ui/` - Radix UI + shadcn primitives
- `src/components/layout/` - Sidebars, headers
- `src/components/employee/` - Employee-specific components
- Feature components colocated with routes (e.g., `src/app/(platform)/instructions/admin/components/`)

### State Management
- Server components fetch data, pass as props
- Client hooks for async state: `useEmployeeInstructions()`, `useAdminInstructions()`, etc.
- Located in route-specific `hooks/` directories

## Key Patterns

### API Route Structure
All API routes follow this pattern:
1. Auth check via `createServerClient()` + `getUser()`
2. Validate user's org/team permissions
3. Use service role client for operations requiring RLS bypass
4. Return JSON with appropriate status codes

### GDPR/PII
- `src/lib/pii.ts` - Masks emails, phones, Norwegian SSNs before external AI
- Always apply `maskPII()` to user content sent to Vertex AI

### Error Handling
- Structured logging via `pino` + Sentry
- Fail-soft for non-critical features (e.g., embeddings fail → instruction still created)

## Testing

**Unit tests:** `tests/unit/` - Vitest with jsdom, covers `src/lib/` excluding Supabase
**E2E tests:** `tests/e2e/` - Playwright, auto-starts dev server

## Environment Variables

**Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CREDENTIALS_JSON`, `NEXT_PUBLIC_APP_URL`

**GCP:** `GCS_BUCKET_NAME`, `DOCUMENT_AI_PROCESSOR_ID`, `DOCUMENT_AI_LOCATION`

**Optional:** `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
