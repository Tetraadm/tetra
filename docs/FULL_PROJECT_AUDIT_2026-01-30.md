# Full Project Audit (Security + Quality)

**Project:** Tetrivo  
**Date:** 2026-01-30  
**Scope:** Repo-wide review of `src/`, `supabase/`, `.github/`, `scripts/`, and key root config files.  
**Out of scope:** `node_modules/` and `.next/` (generated artifacts).  

## Executive Summary

The project has many good security foundations (CSP with nonces, consistent auth checks in API routes, Zod validation in many endpoints, and strong storage policies). However, there is a **high-impact authorization gap** in Supabase RLS: **team-level scoping is implemented in RPCs and Storage policies, but not enforced on direct table reads for `instructions` and `alerts`** (and is also missing on `instruction_reads` inserts). This creates a bypass where any authenticated org member can query published instructions/alerts across the whole org, ignoring team assignments.

There are also several defense-in-depth issues that increase blast radius if a server secret is accidentally bundled client-side or if logs are accessed.

## Method / What Was Checked

- Next.js middleware and route protection (`src/middleware.ts`).
- All API route handlers under `src/app/api/**`.
- Supabase SQL schema, functions, policies, storage policies (`supabase/sql/consolidated/**`).
- Supabase Edge Functions (`supabase/functions/**`).
- Server-side helper libraries in `src/lib/**`.
- GitHub workflow for scheduled GDPR cleanup (`.github/workflows/gdpr-cleanup.yml`).
- Configuration files (`package.json`, `next.config.ts`, `eslint.config.mjs`, etc.).

## High Priority Findings

### H-01 (High) Team access control bypass via permissive RLS on `instructions`

**What:** The RLS policy for selecting instructions allows **all org members** to read **all published instructions** in their org, regardless of `instruction_teams` assignments.

**Evidence:**
- `supabase/sql/consolidated/05_policies.sql` — policy `CREATE POLICY "View instructions"`:
  - Allows `org_id = get_my_org_id()` and `(admin OR (published & not deleted))` but **does not check team assignment**.

**Impact:**
- Any authenticated user can bypass the UI/RPC restrictions by querying `instructions` directly and reading titles/content for other teams.
- This undermines the purpose of `instruction_teams`, team-scoped RPCs, and storage’s team-scoped access model.

**Fix recommendation (defense + correctness):**
- Update the `instructions` SELECT policy to include team scoping logic consistent with `get_user_instructions()` and storage policy:
  - If the instruction has no team assignments → visible to org members.
  - If it has assignments → visible only to members of an assigned team.
  - Admins remain org-wide.

---

### H-02 (High) Team access control bypass via permissive RLS on `alerts`

**What:** Alerts are team-mapped via `alert_teams`, but the SELECT policy is org-wide (admins see all; others see all active).

**Evidence:**
- `supabase/sql/consolidated/05_policies.sql` — policy `CREATE POLICY "View org alerts"`:
  - Checks org + active/admin only; **does not check `alert_teams`**.

**Impact:**
- Any org member can query `alerts` directly and see alerts intended for other teams.

**Fix recommendation:**
- Apply the same team-scoping logic as used in `get_user_alerts()` (or align app intent to “org-wide alerts” and remove team mappings if not needed).

---

### H-03 (High) `instruction_reads` insert policy does not enforce team access

**What:** Users can insert/confirm reads for any published instruction in their org, even if it’s assigned to a different team.

**Evidence:**
- `supabase/sql/consolidated/05_policies.sql` — policy `CREATE POLICY "Users insert own reads"`:
  - Validates org + published but **does not check `instruction_teams`**.

**Impact:**
- Cross-team state mutation (“I have read/confirmed”) is possible.
- This can poison read metrics and potentially create information leaks through reporting (depending on who can view what).

**Fix recommendation:**
- Add the same team-access check used in storage/chunks/RPCs to the INSERT and UPDATE checks for `instruction_reads`.

---

### H-04 (High) Server secrets are used in non-`server-only` modules (accidental client bundle risk)

**What:** Multiple modules in `src/lib/` read server-only secrets from `process.env` but are not protected with Next’s `import 'server-only'`.

**Evidence:**
- `src/lib/edge-functions.ts` reads `process.env.SUPABASE_SERVICE_ROLE_KEY` and `process.env.EDGE_FUNCTION_SECRET`.
- `src/lib/vertex-chat.ts` reads `process.env.EDGE_FUNCTION_SECRET`.
- `src/lib/vertex-search.ts` reads `process.env.EDGE_FUNCTION_SECRET`.
- `src/lib/cache.ts` reads `process.env.UPSTASH_REDIS_REST_TOKEN` and `process.env.UPSTASH_REDIS_REST_URL`.
- `src/lib/embeddings.ts` reads `process.env.GOOGLE_CREDENTIALS_JSON`.

**Impact:**
- If any of these modules are ever imported into a `use client` component (now or in the future), bundling could expose secrets to browsers.

**Fix recommendation:**
- Add `import 'server-only'` to all modules that use server secrets.
- Consider moving them under a `src/lib/server/` folder to make misuse harder.

## Medium Priority Findings

### M-01 (Medium) Search cache keys can contain user query text (PII exposure via Redis keys)

**What:** The Redis cache key embeds the full normalized query string.

**Evidence:**
- `src/lib/cache.ts` — `generateSearchCacheKey()` includes `${normalizedQuery}` in the key.

**Impact:**
- If user queries contain PII, the PII becomes part of Redis keyspace (often visible in dashboards/logs and harder to sanitize/retire than values).

**Fix recommendation:**
- Hash the query into the key (e.g., `sha256(normalizedQuery)`) and keep PII out of key names.

---

### M-02 (Medium) Supabase Edge Functions lack a dependency lockfile (supply-chain hardening)

**What:** Edge Functions import dependencies from remote URLs (`deno.land`, `esm.sh`) without a `deno.lock`.

**Evidence:**
- `supabase/functions/**/index.ts` imports from:
  - `https://deno.land/std@...`
  - `https://esm.sh/@supabase/supabase-js@...`
- No `deno.lock` found in the repo.

**Impact:**
- Reduced reproducibility and supply-chain hardening vs. a locked dependency graph.

**Fix recommendation:**
- Add `deno.lock` and ensure Supabase deploy uses it, or vendor/pin dependencies per Supabase’s recommended approach.

---

### M-03 (Medium) Edge Functions log potentially sensitive user content

**What:** Some Edge Functions log user-provided content (even if truncated).

**Evidence:**
- `supabase/functions/gemini-chat/index.ts` logs user message snippets and model response snippets.
- `supabase/functions/vertex-search/index.ts` logs query + orgId.

**Impact:**
- PII or confidential info can end up in logs.

**Fix recommendation:**
- Remove content logging or log only request IDs and lengths.
- Apply the same `maskPII()` approach used in `src/app/api/ask/route.ts` where logging is needed.

---

### M-04 (Medium) `process-document` triggers `generate-embeddings` without `X-Edge-Secret` header

**What:** `process-document` calls `generate-embeddings` but does not include the internal secret header required by the target function.

**Evidence:**
- `supabase/functions/process-document/index.ts` triggers embeddings via `fetch(embeddingsUrl, ...)` using `Authorization` only.
- `supabase/functions/generate-embeddings/index.ts` validates `X-Edge-Secret` and rejects if missing/incorrect.

**Impact:**
- Embedding generation may silently fail after document processing, leading to missing search capability and operational confusion.

**Fix recommendation:**
- Add `X-Edge-Secret` to the internal call or unify the auth approach for internal Edge Function chaining.

---

### M-05 (Medium) Read-confirmations reporting RPCs rely on API-layer auth only

**What:** Some RPCs are `SECURITY DEFINER` and are executable only by `service_role`, with comments saying “API verified admin already”.

**Evidence:**
- `supabase/sql/consolidated/09_read_confirmations_rpc.sql` uses `service_role` grants and no `auth.uid()` checks.
- `src/app/api/read-confirmations/route.ts` uses `createServiceRoleClient()` to call them.

**Impact:**
- Increases blast radius if server credentials leak.
- Makes DB-level security less self-contained.

**Fix recommendation:**
- Prefer RPCs callable by authenticated users with in-function checks (`auth.uid()` + admin role) so the DB remains authoritative.
- If service_role is required, reduce what these functions return (e.g., avoid raw emails) and consider extra safeguards.

## Low Priority / Quality Issues

### L-01 (Low) Next + ESLint config version mismatch risk

**Evidence:**
- `package.json`: `next` is `^16.1.6` while `eslint-config-next` is `15.1.3`.

**Impact:**
- Tooling drift can cause incorrect lint rules, build warnings, or missed Next-specific checks.

**Fix recommendation:**
- Align `eslint-config-next` to the same major/minor range as `next`.

---

### L-02 (Low) Upload route sanitization is inconsistent with text-instruction routes

**Evidence:**
- `src/app/api/instructions/route.ts` and `src/app/api/instructions/[id]/route.ts` sanitize `title/content` via `sanitizeHtml`.
- `src/app/api/upload/route.ts` inserts `title/content` without the same sanitization.

**Impact:**
- Inconsistent stored data hygiene; can become security-relevant if any rendering changes to HTML in the future.

**Fix recommendation:**
- Apply the same sanitization to upload’s `title` and any user-supplied `content` before storing.

---

### L-03 (Low) In-memory rate-limit fallback in contact route can grow unbounded

**Evidence:**
- `src/app/api/contact/route.ts` uses a `Map` for fallback rate limiting without periodic cleanup.

**Impact:**
- Memory growth risk under high cardinality of IPs (less relevant in many serverless setups, but still a risk).

**Fix recommendation:**
- Add periodic cleanup (similar to `InMemoryRatelimit` in `src/lib/ratelimit.ts`) or disable in-memory fallback in production.

---

### L-04 (Low) Vertex Search org filtering is substring-based

**Evidence:**
- `supabase/functions/vertex-search/index.ts` filters results with `r.link?.includes(orgId)`.

**Impact:**
- Fragile parsing; could misbehave if URI formats change.

**Fix recommendation:**
- Parse GCS/object paths and compare the orgId path segment exactly.

## Notes on Local Secret Files

- `.env.local` and `.mcp.json` are correctly ignored by `.gitignore` (verified via `git check-ignore`), but they contain sensitive configuration and should be treated as secrets at rest.
- If these files have ever been committed historically, rotate all affected credentials and purge git history.

## Suggested Next Actions (Practical Order)

1. Fix RLS for `instructions`, `alerts`, and `instruction_reads` to match the intended team-scoped model.
2. Add `import 'server-only'` to all server-secret-bearing modules in `src/lib/`.
3. Hash Redis cache keys and reduce sensitive logging in Edge Functions.
4. Add a dependency lock strategy for Supabase Edge Functions (e.g., `deno.lock`).
5. Run dependency vulnerability scanning (`npm audit`) and resolve high/critical advisories.

