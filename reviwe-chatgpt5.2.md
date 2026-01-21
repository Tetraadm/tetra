Hopp til innhold
Chattehistorikk



ChatGPT sa:
0) Executive Summary
This audit reviews the Tetrivo HMS code‑base (Tetraadm/tetra) as of 21 Jan 2026. The application is a multi‑tenant health, safety and environment (HSE/HMS) platform built with Next.js 16, Supabase/Postgres (with row‑level security) and serverless API routes. The repository was fully inspected including the Supabase SQL, migrations, policies, triggers, RPC functions, API routes, client components, middleware, environment setup and CI/CD configuration.

Headline: The codebase is well structured and demonstrates good security hygiene (strong RLS policies, server‑side auth checks, GDPR functions, rate limiting, CSP headers, operational runbook). However, a few critical gaps remain – particularly around RPC functions without auth context, potential data leakage through direct function calls, incomplete privacy hardening and limited test coverage. With these addressed, the project could be pilot‑ready for enterprise use.

Pilot Readiness %: 70 % (out of 100). Reasons:

Robust RLS policies: Each tenant‑scoped table has RLS enforced and sensitive fields (role/org/team) are locked for non‑admins
.

Security‑definer functions: Most RPC functions validate auth.uid() to prevent cross‑user data access
.
.

Server‑side auth & role checks: API routes verify user session, role and org membership before mutations
.
.

Strict storage policies: File storage denies all client‑side writes and only allows org‑scoped reads
.

GDPR tooling: Functions for DSAR export and hard delete enforce authentication, admin confirmation and anonymised audit logs
.
.

Security headers: Next.js config adds HSTS, X‑Frame‑Options, Referrer‑Policy, and a baseline CSP
.

Operational readiness: A comprehensive runbook covers login issues, email delivery, backups and monitoring.

Top risks/weaknesses:

Unsafe RPC functions – get_instruction_read_stats, get_instruction_user_reads and count_org_instructions are marked SECURITY DEFINER but do not validate auth.uid(). They rely on API‑level checks but could be exploited via direct SQL/RPC calls, allowing an authenticated user to fetch other organisations’ read statistics (critical multi‑tenant breach)
.

No RLS on Supabase internal schema – while RLS is enabled on public tables, the read‑confirmations functions bypass it. Without revoking EXECUTE for these functions from authenticated role, tenants could call them directly.

Missing formal testing – unit tests only cover UI helpers and a few Playwright smoke tests; there are no tests for RLS policies, auth flows, or GDPR functions. This increases risk of unnoticed regressions.

Client‑side Supabase usage – front‑end components use Supabase client directly in the browser; while RLS mitigates some risk, additional server‑side validation and field filtering would reduce data exposure.

CSP allows unsafe‑inline scripts – the content security policy still allows inline scripts and styles
, leaving room for XSS if a bug occurs.

Limited monitoring – Sentry is configured but there is no integration with performance metrics, nor are there alerts for rate limiter misconfiguration.

Rate limiter fallback – if Upstash is not configured in production, rate limiting falls back to per‑lambda in‑memory; this is flagged but not enforced, leaving risk of abuse during misconfiguration.

Top 10 Must‑Fix Before Pilot:

Add auth checks to read‑confirmation RPC functions (count_org_instructions, get_instruction_read_stats, get_instruction_user_reads) and restrict execution to admins; revoke EXECUTE from authenticated role.

Enforce RLS in RPC: Move statistical computations to SQL queries called via API or add explicit auth.uid() verification inside these functions.

Implement end‑to‑end tests verifying RLS policies, role restrictions, invite flow and GDPR hard‑delete operations.

Harden CSP: Replace unsafe‑inline script/style directives with nonce‑based approach; adopt style-src 'self' once CSS modules are used
.

Expand logging and monitoring: Add structured logs, Sentry performance tracing, and alerting on rate limiter misconfigurations and RLS violations.

Limit client‑side data exposure: Filter out sensitive fields when fetching data on the client; avoid selecting entire rows (e.g., profiles includes email) unless necessary.

Review API error messages: Ensure they do not leak internal details (stack traces) and that Norwegian/English language is consistent.

Add automated migrations tests to ensure order and idempotence; verify that destructive operations in RESET_GUIDE.md are only used in local development.

Document data retention settings clearly and implement environment‑driven retention periods.

Conduct penetration test focusing on multi‑tenant isolation, AI prompt injection in the ask endpoint, and file‑upload path traversal.

1) Repository Map
The repository is organised into clear domains. Below is a high‑level map of important folders and their purpose:

Path	Purpose
supabase/sql/consolidated/	All database migrations, functions and policies. Files 01_extensions.sql – 10_gdpr_cron.sql define schema, indexes, RLS policies, triggers, storage rules, GDPR functions and cron jobs. This is the single source of truth for the DB.
src/app/	Next.js app routes grouped by public vs platform. (public) contains auth and invite pages; (platform) contains protected dashboards for admin, leader and employee; api/ holds server‑less API endpoints.
src/lib/	Shared utilities: Supabase client wrappers (supabase/client.ts and server.ts), rate‑limiter setup, embedding and keyword extraction, audit logging helper, invite cleanup, UI helpers and type definitions.
scripts/	Node scripts such as backfill‑embeddings.ts for generating embeddings with OpenAI.
tests/	E2E Playwright tests and minimal unit tests.
.github/workflows/ci.yml	CI pipeline that runs ESLint, TypeScript checks and builds the application (but does not run tests). Uses dummy environment variables to avoid leaking secrets.
Root configs	next.config.ts defines security headers and Sentry integration
; middleware.ts protects routes and enforces authentication
; README.md and RUNBOOK.md provide documentation and operational guidance.
Critical boundaries include:

Frontend (client components in src/app and src/components), which uses Supabase browser client and relies on RLS.

Backend/API – src/app/api contains serverless route handlers that perform validation, role checks and interact with Supabase using the server client.

Database layer – all schema, functions and policies defined in supabase/sql. Functions are set SECURITY DEFINER to operate with service role privileges.

Auth – handled by Supabase; Next.js middleware uses createServerClient to refresh sessions and redirect unauthenticated users
.

Storage – Supabase storage bucket instructions with policies denying client uploads and restricting reads to org members
.

CI/CD – GitHub workflow only runs lint, typecheck and build; no tests or deployment pipeline.

2) Findings (File‑Referenced, Categorized)
Each finding includes severity, location and remediation suggestions. Effort estimates are relative (S = small, M = medium, L = large).

RLS & Multi‑tenancy
[RLS‑01] Missing auth checks in read‑confirmation RPC (Critical)

Location: supabase/sql/consolidated/09_read_confirmations_rpc.sql – functions count_org_instructions, get_instruction_read_stats and get_instruction_user_reads

Problem: These functions are defined SECURITY DEFINER and do not validate auth.uid() or ensure the caller is an admin. They accept p_org_id and return aggregated read metrics or user‑level read status for any organisation. If an authenticated user calls the function directly via RPC (Supabase client), they could fetch metrics of other organisations.

Impact: Data leakage across tenants – an attacker could enumerate instruction read status of all users and instructions by passing another org_id, violating GDPR and contractual obligations. Since RLS is bypassed by security‑definer functions, the risk is critical.

Fix: Add explicit checks at the start of each function:

IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
-- ensure caller is admin of the organisation
IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND org_id = p_org_id) THEN
    RAISE EXCEPTION 'forbidden';
END IF;
Alternatively, remove these functions and perform the aggregation inside API routes where user context is available.

Verification: Attempt to call rpc('get_instruction_read_stats', { p_org_id: other_org }) as a non‑admin user; confirm it returns error. Add automated tests to ensure RLS enforcement.

Effort: M, but high risk if left unresolved.

[RLS‑02] Lack of GRANT/REVOKE for risky RPC (High)

Location: 09_read_confirmations_rpc.sql (no explicit REVOKE/GRANT statements for the above functions).

Problem: Without revoking default privileges, these functions are likely executable by authenticated role. Combined with [RLS‑01], this allows any authenticated user to call them.

Impact: Same as above – potential data leakage.

Fix: Add REVOKE EXECUTE ON FUNCTION ... FROM authenticated and GRANT EXECUTE only to service_role or an admin role. Document which roles may call them.

Verification: Inspect pg_proc privileges after deployment; ensure the functions are not callable via Supabase client by non‑admins. Write integration tests.

Effort: S.

[RLS‑03] Vector search function lacks team filter (Medium)

Location: 08_vector_fix.sql – function match_instructions
.

Problem: The function restricts results by org_id but not by instruction_teams. It includes a comment acknowledging the trade‑off. This means employees could see instructions assigned to other teams if they call the RPC directly (the API still filters results on the server, but misuse is possible via supabase client). RLS policies on instructions restrict published instructions by org only (team membership is optional)
.

Impact: Team‑specific instructions may be leaked to any member of the same organisation. Depending on the HSE policies, this could reveal sensitive procedures.

Fix: Update match_instructions to join with instruction_teams and filter by the caller’s team_id (obtain via auth.uid()); or remove this function and perform vector search within the API route using existing RLS.

Verification: After change, run vector search as a user not belonging to a team; ensure they only see instructions without team assignments. Add tests.

Effort: M.

[RLS‑04] get_invite_by_token accessible by unauthenticated user (Medium)

Location: supabase/sql/consolidated/03_functions.sql – get_invite_by_token
 and GRANT statements.

Problem: This function is SECURITY DEFINER and is granted to anon and authenticated users; it returns organisation and team names for a valid token. While tokens are random, there is no rate limiting on RPC usage. An attacker could iterate tokens to guess invites and discover organisation names.

Impact: Information disclosure (org and team names) and potential enumeration of valid invite tokens.

Fix: Add LIMIT 1 (already there) and a check that the token is less than 7 days old (already). Additionally, implement rate limiting at the API layer (invite flow already rate limits) and consider requiring some secret (OTP) before returning details.

Verification: Monitor logs for repeated get_invite_by_token calls; ensure API rate limit triggers. Add tests.

Effort: S.

[RLS‑05] Hard delete function logs hashed user id but does not delete from auth.users (Low)

Location: gdpr_hard_delete_user
.

Problem: The function deletes user data from public schema and logs an anonymised hash but relies on manual deletion of the Supabase auth.users row. If operators forget the second step, ghost user accounts may persist.

Impact: Incomplete right‑to‑be‑forgotten compliance; residual credentials remain.

Fix: Document the manual step prominently. Create an administrative UI or script that calls both the SQL function and Supabase Admin API to remove the auth.users record. Consider adding a trigger on profiles deletion to cascade to auth.users using the Admin API.

Verification: After deletion, attempt to sign in with the user’s email; ensure account is gone.

Effort: M.

Auth / API
[API‑01] API read‑confirmation route relies on RPC without additional checks (High)

Location: src/app/api/read-confirmations/route.ts – get_instruction_read_stats & get_instruction_user_reads invocation
.

Problem: The API checks that the caller is an admin, then calls the RPC functions. However, because the RPC functions do not validate auth (see RLS‑01/02), any misconfiguration of role checks or misuse via client can bypass this protection.

Impact: Attackers could call these RPCs directly using Supabase client or via GraphiQL and retrieve data even if the API route is secured.

Fix: Same as RLS‑01/02 – enforce auth inside the functions and restrict privileges. Additionally, consider implementing the statistical queries directly in the API route using RLS‑protected tables.

Verification: Attempt to call the RPC from the client; ensure it fails without proper privileges.

Effort: M.

[API‑02] Rate limiter misconfiguration not enforced (Medium)

Location: src/lib/ratelimit.ts – createRateLimiters() fallback for production without Upstash.

Problem: If Upstash environment variables are missing in production, the rate limiter logs a warning and falls back to per‑lambda in‑memory storage; requests across instances are not throttled.

Impact: Attackers could flood the AI or upload endpoints by rotating IP/instances, causing denial of service or high API costs.

Fix: Fail closed when misconfigured: return 503 for protected routes if Upstash is not configured. Expose a health check endpoint for the rate limiter (getRateLimiterStatus() is exported but unused).

Verification: Remove Upstash vars in staging and confirm that API routes return 503. Add a CI test.

Effort: S.

[API‑03] CSP allows unsafe‑inline scripts (Medium)

Location: next.config.ts – Content‑Security‑Policy header
.

Problem: The CSP includes script-src 'unsafe-inline' and style-src 'unsafe-inline' which permit inline scripts and styles. Comments indicate this is temporary, but no nonce approach is implemented.

Impact: XSS vulnerabilities in client components could be exploitable. Enterprise customers may require a strict CSP.

Fix: Use Next.js experimental.cspNonce to generate nonces and add them to all script tags; remove unsafe-inline. Move inline CSS to modules or external files.

Verification: Deploy with the nonce CSP and verify pages render without inline script errors. Use a CSP violation reporter.

Effort: M – cross‑cutting change but manageable.

[API‑04] Overly permissive error messages (Low)

Location: Several API routes return raw error messages in development (e.g., ask endpoint returns error.message when not in production). Even though this is hidden behind NODE_ENV !== 'production', misconfiguration could leak sensitive stack traces.

Fix: Always log internal errors server‑side and return generic messages to the client. Add structured logging.

Effort: S.

Database / Migrations
[DB‑01] Use of UUID default via uuid_generate_v4()

Location: 02_schema.sql uses DEFAULT extensions.uuid_generate_v4() for primary keys (not shown in citations but present in schema). This is good and ensures uniqueness.

Strength: Good practice; no changes needed.

[DB‑02] Foreign keys cascade rules

Observation: The schema uses ON DELETE CASCADE judiciously (e.g., instruction_teams cascades on instruction_id, alert_teams on alert_id). This simplifies cleanup when an instruction or alert is removed.

Strength: Good maintainability.

[DB‑03] Index coverage

Observation: All frequently queried columns have supporting indexes (idx_instruction_reads_instruction_id, idx_profiles_org_id, GIN index on instructions.keywords, HNSW index for embeddings)【02_schema】. This is positive.

Recommendation: Monitor query plans; consider partial indexes on instruction_reads (confirmed) only for confirmed=true if read heavy.

[DB‑04] No support for soft delete on users/instructions (Low)

Problem: instructions table has deleted_at but there are no functions or triggers enforcing soft delete. Client code uses hard deletion in API; misuse might permanently erase data. Similarly, profiles deletion is hard (via GDPR), but there is no field deleted_at for soft deactivation.

Fix: Add deleted_at columns and use upsert to mark deletion; update RLS to exclude deleted_at IS NOT NULL in queries; provide a restoration function.

GDPR & Privacy
[GDPR‑01] DSAR export does not include storage files (Medium)

Location: gdpr_export_user_data function
.

Problem: The function exports data from database tables but does not include files stored in the instructions bucket. The comments mention manual handling. If documents contain personal data, DSAR response may be incomplete.

Fix: Provide tooling to list and download user‑uploaded files (e.g., attachments or instruction uploads) based on ownership or reference. Add this to export.

[GDPR‑02] Audit logs might contain personal data

Observation: audit_logs include a details JSONB column where API routes store email addresses of invitees
. Since logs are retained for 90 days by default, email addresses remain until cleanup. Pseudonymisation is inconsistent across log types.

Recommendation: Minimise PII in audit logs. When possible, hash or partially redact email addresses (e.g., user@example.com -> u***@example.com) and store role/team instead of personal identifiers.

[GDPR‑03] Manual deletion of Supabase auth users (Low)

Addressed in RLS‑05. Documented in runbook but could be automated.

[GDPR‑04] Lack of automated retention scheduling

Observation: 10_gdpr_cron.sql provides instructions to schedule cleanup jobs via pg_cron, but the project does not provision or enable them automatically. Without scheduling, logs will grow indefinitely.

Fix: On project initialization, call CREATE EXTENSION IF NOT EXISTS pg_cron and schedule cleanup_all_old_logs monthly
. Document retention period and make it configurable via environment variables.

Storage & File Security
[STOR‑01] Bucket read policy relies on file path naming

Location: 06_storage.sql – policy Org members read instruction files
.

Problem: The policy checks split_part(name,'/',1) equals the user’s org_id string. This requires strict file naming ({orgId}/{file}) and depends on client code to enforce naming. A misnamed file could inadvertently be exposed or become inaccessible.

Impact: Data leakage if a malicious admin uploads a file under another org prefix; or denial of access if naming fails.

Fix: Enforce file path structure server‑side in the upload API (currently done by concatenating org id) and validate file.name to prevent path traversal. Consider storing org_id metadata in the storage object and enforce RLS based on metadata rather than path.

Verification: Attempt to upload a file with ../ in its name; ensure the API rejects it. Use Supabase CLI to list bucket objects and confirm only valid prefixes exist.

[STOR‑02] Client‑side file uploads are completely blocked

Observation: All storage INSERT/UPDATE/DELETE policies return false
. Only the service role (server API) can write. This is positive; no changes needed.

Frontend / UX / DX
[FE‑01] Overfetching user data in dashboard (Low)

Location: src/app/(platform)/instructions/admin/page.tsx selects all profiles and includes sensitive fields (email) and organisations for the admin dashboard. This could leak information if the component is reused incorrectly.

Fix: Limit selected columns to what the UI actually needs (e.g., id, full_name, role) and avoid selecting email for non‑admin or display.

[FE‑02] Client‑side Supabase queries rely on RLS

Observation: Many client components fetch data directly from Supabase using the browser key (NEXT_PUBLIC_SUPABASE_ANON_KEY). While RLS policies are strong, any misconfiguration could expose data. Server components (e.g., admin/page.tsx) are used for initial fetch which is good. Continued vigilance is required.

[FE‑03] Long lists may be slow

Observation: The admin dashboard fetches up to 50 teams, 50 users, etc. on page load. With large tenants, this could cause performance issues. Pagination is implemented in hooks but initial limit should be tuned.

Strengths: UI uses modern React 19, proper Zod validation, accessible design (radix UI), and encourages Norwegian localisation.

Observability & Operations
[OBS‑01] Limited log aggregation and monitoring (Medium)

Observation: The code integrates Sentry (client, server, edge) and adds error and performance sampling. However, there is no central logging of API requests or rate limit events; Upstash misconfiguration is logged but not alerted. The CI pipeline does not run tests or send notifications.

Fix: Integrate structured logging (e.g., Winston/Pino) and forward logs to a central service (Datadog, Logtail). Add Sentry performance tracing for API routes. Configure alerts on Sentry issues and Upstash metrics.

[OBS‑02] Health endpoint lacks full checks

Observation: /api/health checks only database connectivity via auth.getSession()【health】; it does not verify storage, third‑party APIs (Anthropic, Resend) or rate limiter configuration.

Fix: Expand health checks to test a simple database query, storage read/write (with service role), AI provider status and rate limiter readiness. Add X‑Service‑Version header for release tracking.

Testing & Release
[TEST‑01] Sparse test coverage (High)

Observation: tests/e2e contains three Playwright specs (health endpoint, login page and navigation). tests/unit has a single UI helper test. There are no tests for API routes, RLS enforcement, multi‑tenant isolation or GDPR functions.

Impact: Regression bugs or security issues may go unnoticed.

Fix: Implement unit tests for each API route using Supabase test client; integration tests that simulate multiple users/tenants to assert RLS enforcement; and property‑based tests for GDPR functions and cron jobs.

Effort: L – requires building a test harness and seeding test data.

[TEST‑02] CI pipeline does not run tests (Medium)

Location: .github/workflows/ci.yml only runs lint, typecheck and build.

Fix: Add npm test and npm run test:e2e to CI; enforce coverage thresholds; run migrations using Supabase CLI in a test database.

Other
[OTHER‑01] Code comments reveal internal notes (Low)

Observation: Some comments in SQL and code refer to internal decisions or TODOs (e.g., -- For Pilot simplification: ...
). These might be confusing for auditors or customers.

Fix: Clean up comments before production or mark them clearly as internal notes.

3) Multi‑Tenant & RLS Deep Audit
The platform is designed for multi‑tenant use; each record references org_id and, where relevant, team_id. RLS is enabled on all public tables. Below is a coverage table summarising RLS presence and risk:

Table	RLS Enabled	Policies Summary	Risk Notes
organizations	✅	Users can read only their own org
; admins can update their org only
.	Good enforcement; no delete policy (implicit only superuser).
teams	✅	Read allowed for same org
; admins can manage teams
.	Fine. Ensure cross‑table updates not misused.
profiles	✅	Users can read their profile; team leaders can read team members; admins can read org profiles
. Update policy locks role, org_id and team_id for non‑admins
. Admins can delete.	Excellent; prevents privilege escalation.
folders	✅	Read org folders; admins manage folders
.	Good.
instructions	✅	Users can view published instructions in their org
; admins can view/manage all instructions
.	Team scoping enforced via instruction_teams function; vector search function is less strict (see [RLS‑03]).
instruction_teams	✅	Users can view instruction teams if they belong to the same org; admins manage
.	Good.
instruction_reads	✅	Users can insert/update their own reads and view their reads; admins can view all reads in org
.	Good.
alerts	✅	Users see active alerts in their org
; admins can view/manage all alerts
.	Good. Alerts have active flag index.
alert_teams	✅	Users view alert teams if they are in the same org; admins manage
.	Good.
invites	✅	Only admins manage invites
.	The RPC to get invite details (get_invite_by_token) is still accessible to anon; rate limiting recommended.
audit_logs	✅	Users can insert logs; only admins can read audit logs
 (commented; actual policy ensures correct).	Good; but logs may contain PII.
ask_tetra_logs	✅	Users insert; admins read.	Good; retention handled via cron.
ai_unanswered_questions	✅	Users insert; admins read.	Good; retention.
gdpr_retention_runs	✅	Only admins can read.	Good.
Function review:

get_user_instructions and get_user_alerts – good checks: they ensure auth.uid() matches p_user_id and restrict by org and team
.

match_instructions – obtains org_id from p_user_id and filters by org_id
 but does not filter by team; considered medium risk.

get_invite_by_token – returns invite data for unused tokens; no auth.uid() needed. Acceptable if tokens are sufficiently random and API rate limits calls.

GDPR functions – implement strict auth and admin checks; gdpr_hard_delete_user prevents self deletion, requires confirmation and logs anonymised details
.

Cleanup functions – cleanup_* functions are revoked from authenticated role and granted to service_role; safe.

Read‑confirmation RPCs – lacking auth/role checks; high risk (see [RLS‑01]).

4) GDPR & Privacy Compliance Audit
Data minimisation: The profiles table stores minimal personal data (full name, email, role, org_id and team_id); invites store only token, role and optional email; logs store user_id and sometimes email of invitees (should be hashed). AI logs store question and answer. There is no birth date, address or other sensitive attributes.

Logging: Audit logs include action_type, entity_type, entity_id and arbitrary details JSON. Some API routes log PII (invited email, question text). DSAR and hard‑delete functions export these logs
; retention cleanup purges them after 90 days.

Retention/deletion: Cleanup functions delete logs older than a configurable number of days; a pg_cron schedule is recommended but not automatically enabled
. There is a DSAR export function and a hard delete function which includes anonymised logging and confirms admin context
. Soft deletion is not implemented for all tables.

Access rights: RLS ensures users can only see their own data or organisation data. Admins cannot delete themselves and must confirm deletion requests. DSAR export restricts access to the user or admin of same org and denies unauthenticated calls
.

Encryption: Supabase provides encrypted storage at rest and TLS in transit (assumed). The code uses HTTPS for external calls and uses environment variables (no secrets in repo). The Next.js CSP enforces HTTPS and denies framing.

Secrets handling: No secret keys are stored in git. .env.example uses placeholders; CI uses dummy values; server code references environment variables. Good practice.

Recommended GDPR hardening actions:

Hash email addresses before logging them in audit_logs; only store domain or first letter (data minimisation). Adjust API logging accordingly.

Automate retention schedule using pg_cron or Supabase's scheduled functions; make retention period configurable via environment variables.

Include storage files in DSAR export or provide instructions for manual export; ensure user data across storage is considered.

Add soft delete / deactivation to profiles and instructions to allow temporary removal without data loss.

Encrypt sensitive AI logs (if questions may contain PII) or mask them before storage.

Provide a UI for admins to manage data subject requests (export, deletion) and confirm operations.

Audit logging of admin actions should capture role, timestamp and anonymised identifiers; restrict details to relevant fields.

Log retention for invites – automatically purge unused invites older than 30 days.

Ensure cookie consent and privacy policy pages are implemented and localised.

Review third‑party providers (Resend, Anthropic) for GDPR compliance and include in Data Processing Agreements.

5) Authentication & Authorization
Supabase Auth: The application uses Supabase email magic‑link authentication. Next.js middleware refreshes sessions and redirects unauthenticated users away from protected routes
. Public routes (/login, /invite, /api/health, /api/contact) bypass auth. If a user is authenticated and visits /login, they are redirected to /post‑auth. This flow is sound.

Role model: There are three roles – admin, teamleader and employee. Roles are stored on the profiles table and locked via RLS. Server components check role before performing admin actions (e.g., create instruction, invite user). Client pages redirect users based on their role (admin -> /admin, team leader -> /leader, employee -> /employee).

Invite flow: Invites are created by admins via the API. Invites contain a random token and expire after 7 days. Users accept invites through a magic‑link OTP; the accept_invite function verifies that the invite is unused and that the user does not belong to another org
. Audit logging and rate limiting are applied in the API.

Session security: Cookies are set with httpOnly, secure and sameSite options by Supabase client. Middleware replicates cookies when refreshing sessions. No plain text tokens are stored in localStorage (session storage is used temporarily for invite name). Client‑side watchers redirect on sign‑out.

Potential issues:

RPC functions bypassing auth (RLS‑01/02) remain the main auth risk.

Client‑side data fetching could reveal more fields than necessary, particularly email addresses on the admin dashboard. Minimising fields selected will reduce exposure.

Magic link brute‑force – there is no explicit rate limit on OTP sign‑in; rely on Supabase to throttle attempts. Ensure this is configured.

Overall, authentication and authorisation are thoughtfully implemented with server‑side checks and RLS. The main improvement is to tighten RPC functions and avoid reliance on client‑side controls.

6) Database & Migration Safety
Ordering & idempotency: The RESET_GUIDE.md instructs dropping and recreating the public schema and then applying migrations in a specific order. The consolidated SQL files are ordered logically. Migrations are idempotent (use IF NOT EXISTS for extensions, columns, indexes) and can be reapplied safely. However, there is no automated migration runner; manual execution increases risk of missed steps.

Constraints: All primary keys use UUIDs with default generation. Foreign keys enforce cascading deletes where appropriate. CHECK constraints exist for severity and status enumerations via enumeration columns.

Indexes: Comprehensive indexes are defined for foreign keys and frequently queried columns (org_id, team_id, status, severity)【02_schema】. HNSW index is used for vector similarity search.
. There is a GIN index on keywords. This ensures good query performance.

Triggers: update_updated_at_column() automatically updates updated_at on instructions and can be applied to other tables as needed. sync_profile_email() updates profiles.email when auth.users changes【04_triggers】. Both functions set search_path=public and run as SECURITY DEFINER. They should be audited for permission scope.

Idempotent drop policies: Before creating storage policies, old policies are dropped
; this avoids duplicates.

Potential improvements:

Provide a migrations directory with incremental SQL files and a script for Supabase CLI to apply them automatically.

Add ON UPDATE CASCADE constraints for foreign keys referencing profiles.id (e.g., when merging accounts) if supported by Supabase.

7) Storage & File Security
The platform stores uploaded documents (PDFs, images, text) in a private Supabase storage bucket instructions. Key points:

Bucket configuration: The bucket is created with public=false and file size limit of 50 MB; allowed MIME types are PDF and image formats
. This reduces risk of arbitrary file types.

Read policy: Only org members can read files whose name starts with their org_id prefix
. This depends on the correct prefix being set when uploading.

Write policies: All client‑side insert/update/delete operations are blocked (policies return FALSE)
. Only the service role used by the API can upload or delete files. This is the correct approach to avoid bypassing server validations.

API upload route: The upload endpoint performs extensive checks: Zod validation, file type/size enforcement, PDF parsing with timeouts, rate limiting, admin role verification, and safe file path generation using orgId prefix and a new UUID
. On error, it cleans up partial uploads. Good attention to detail.

Potential improvements:

Validate file names to prevent path traversal and ensure they are safe for file systems.

Store the org_id in object metadata and base RLS policies on metadata rather than path splits to avoid manual prefix management.

Provide a mechanism to rotate uploaded files (versioning) and to soft‑delete them along with instructions.

8) Frontend & API Review
Public pages: Landing page and login page are accessible without authentication. The login flow uses magic link and shows validation errors. Playwright tests cover basic display.

Protected pages: admin, leader and employee dashboards are server components that fetch user profile via server‑side Supabase client and redirect based on role. They pass initial data to client components which then use supabase browser client for further actions. The server components limit data by org_id and role, but the client must still rely on RLS for additional queries.

API routes: Each serverless API handler validates input using zod, verifies user session, checks role and org membership, and enforces rate limiting. Errors are logged server‑side and generic messages are returned in production. The ask endpoint streams responses from Anthropic while logging questions and unanswered queries; it falls back to keyword search if vector search fails. Rate limiting is applied per user and misconfiguration returns 503
.

Security controls: The middleware.ts implements route matching to protect sensitive routes and redirects unauthenticated users to login
. Cookies are managed with appropriate options. next.config.ts adds security headers.

User experience: The UI uses Radix components and custom tabs. Some performance issues may occur on large tenants due to initial fetch sizes. There is limited internationalisation (mostly Norwegian). Buttons and forms have validation and accessible labels.

Potential improvements:

Centralise API error handling to standardise responses and logging. Use an error boundary on the client to catch unhandled exceptions.

Implement skeleton loading or optimistic UI updates for long‑running operations (uploads, AI queries).

Add user session management UI (list active sessions, revoke tokens) to satisfy security best practices.

9) Observability & Operations Readiness
Logging & monitoring: Sentry is configured for client, server and edge code with a 10 % trace sample rate. Replay integration is enabled on the client. However, there is no central request logging or metrics collection. Rate limiter misconfiguration only logs a warning but does not alert engineers.

Health checks: /api/health returns status, uptime and database connectivity. It does not check third‑party services (Anthropic, Resend, Upstash) or storage. The runbook recommends configuring uptime monitors.

Runbook: The RUNBOOK.md provides step‑by‑step troubleshooting for auth, email, upload, AI service, RLS issues, backups, rollbacks and monitoring. It lists SLA expectations and contact points. This is excellent for operations.

Deployment pipeline: The CI workflow runs ESLint, typecheck and build but does not run tests. There is no automated deployment or preview environment. Secrets are loaded via Vercel environment variables. The pipeline uses dummy secrets to avoid accidental leaks.

Recommendations:

Integrate a logging library (e.g., Pino) and forward logs to a central log aggregator.

Expand /api/health to check external dependencies and rate limiter status.

Add test execution and database migration verification to the CI workflow. Consider using GitHub Actions to deploy to a staging environment.

Configure alerting for Sentry errors, high 5xx rates, and rate limiting misconfigurations.

Provide dashboards for API latency, error rates and AI usage.

10) Testing & Release Readiness
The test suite is minimal. Unit tests cover only UI helpers (severity and role labels) and e2e tests cover login and navigation. There are no tests for RLS, API routes, GDPR functions or data deletion.

CI does not run tests. Without tests, changes may introduce regressions or security vulnerabilities undetected.

There are no canary deployments or feature flags.

Minimum Pilot Gate Checklist:

Run unit & integration tests automatically on every commit.

Test RLS policies by simulating multiple tenants and verifying isolation.

Test API endpoints for input validation, role checks and correct status codes.

Test file uploads with allowed and disallowed types and sizes.

Test AI endpoint for rate limiting and vector search fallback.

Test invite flow including expired tokens and duplicate invites.

Test GDPR functions – DSAR export and hard delete; ensure data is removed and logs anonymised.

Run SAST/Dependabot to check for vulnerable dependencies.

Smoke test after migrations to ensure DB schema is intact.

Monitor CPU/memory usage under load (AI queries, file uploads).

Verify fallback behaviour when Upstash or Anthropic is unavailable.

Check error localisation (messages in Norwegian and consistent grammar).

Review environment variables per deployment environment; ensure no placeholder values in production.

11) Recommended Additions (High ROI for Enterprise Pilot)
Admin audit log viewer UI – Provide an interface to search and filter audit logs with pagination and export, exposing only anonymised fields. Add ability to download logs for compliance.

Permission matrix UI – Allow admins to configure which teams have access to which instructions/alerts via a visual matrix; reduces misconfiguration risk.

Data retention dashboard – Expose retention settings (days) and allow administrators to trigger cleanup functions or schedule them via UI. Surface metrics on logs and storage usage.

GDPR request portal – Let users request an export or deletion of their data. Provide admin approval workflow.

Session & device management – Show users their active sessions, IP addresses and device names; allow revocation. Adds security transparency.

Rate limit status endpoint – Return current limiter configuration and remaining quotas; useful for troubleshooting and for admin dashboards.

Feature flags / environment toggles – Use a configuration service to enable or disable AI features, vector search, etc. per tenant or environment.

Audit trail for schema changes – Log database migrations executed and by whom; provide a rollback mechanism.

Automated migration runner – Use Supabase CLI or a migration tool to apply SQL files in order; integrate into CI/CD.

CI quality gates – Enforce code coverage thresholds, run SAST (e.g., CodeQL), and run vulnerability scans on dependencies.

Internationalisation support – Abstract strings into localisation files and provide English and Norwegian translations. This helps with multi‑lingual pilots.

User feedback collection – Add instrumentation to gather anonymous usage metrics and user feedback to improve UX.

Incident response playbooks – Expand the runbook with sample incident timelines, roles, and contact information; integrate with PagerDuty or Slack.

Access control for AI logs – Provide a UI to view and delete AI logs; optionally anonymise questions after a period.

Team hierarchies – Support nested teams or groups for complex organisations; update RLS accordingly.

Additional indexes on instruction_reads(confirmed_at) or partial index to optimise queries for confirmed reads.

12) Prioritised Remediation Plan
P0 – Must Fix Before Pilot
Secure read‑confirmation RPC functions (count_org_instructions, get_instruction_read_stats, get_instruction_user_reads): add auth.uid() and admin checks
; revoke default execute privileges; update API accordingly. Effort: M, Risk: Critical.

Restrict RPC privileges: explicitly revoke EXECUTE on all security‑definer functions from public and grant to service_role or appropriate roles. Effort: S.

Harden CSP: implement nonce‑based CSP and remove unsafe‑inline; update next.config.ts. Effort: M.

Fail‑closed rate limiting: enforce 503 responses when Upstash is misconfigured; surface getRateLimiterStatus() on health endpoint. Effort: S.

Implement test suite: write integration tests for RLS, API endpoints and GDPR functions; run tests in CI. Effort: L.

Update documentation: emphasise manual deletion of auth.users when performing hard delete; document DSAR export limitations. Effort: S.

Audit log PII minimisation: sanitise email addresses and sensitive data before storing in audit_logs. Effort: M.

Extend /api/health to check Anthropic, Resend, storage and rate limiter; add X‑Service‑Version header. Effort: S.

Add soft delete mechanism to instructions and profiles; update RLS and UI accordingly. Effort: M.

Review client‑side queries: reduce selected columns (e.g., avoid fetching email for employees); centralise data access. Effort: M.

P1 – High Priority (post‑pilot)
Implement admin & DSAR UI for audits, exports and deletion with clear logs and approval flow.

Introduce feature flags for AI vector search vs keyword search; allow toggling per tenant.

Automate migrations using Supabase CLI; ensure order and verification.

Integrate logging & monitoring with dashboards and alerts; unify error handling; track rate limiter usage.

Enhance team scoping in vector search and possibly support nested teams.

Schedule retention cleanup automatically via pg_cron with environment‑driven settings.

Add session/device management for users.

Internationalise UI and support multiple languages.

P2 – Medium/Low Priority
Performance optimisations (pagination sizes, indexes, caching) once data grows.

UX enhancements (loading states, accessibility improvements, dark mode toggles). Some of this may already exist but should be reviewed.

More comprehensive e2e tests including invite flow, upload errors, AI fallback and retention runs.

Document environment variables and provide strong defaults with warnings on misconfiguration.

Cleanup comments in SQL files and remove internal notes before customer release.

90 %+ Readiness Path
Fix the critical RLS/RPC issues and ensure no cross‑tenant data leakage (P0‑1).

Enforce CSP nonces and strengthen client‑side security (P0‑3).

Implement automated tests and run them in CI (P0‑5). Achieve at least 80 % coverage on API and functions.

Fail‑closed for rate limiter misconfiguration and expand health checks (P0‑4 & P0‑8).

Sanitize and minimise logs; add retention schedule (P0‑7 & P1‑6).

Build admin UI for audit/GDPR operations (P1). Provide DSAR export and deletion flows.

Deploy a staging environment to test migrations and heavy‑load scenarios; run penetration tests focusing on multi‑tenancy and AI injection.

Document the results and update runbook to incorporate new operational procedures.

Completing the above will raise pilot readiness above 90 %, satisfying enterprise requirements for security, privacy and operational robustness.



Kilder
ChatGPT kan gjøre feil. Sjekk viktig informasjon. Se Innstillinger for informasjonskapsler.
