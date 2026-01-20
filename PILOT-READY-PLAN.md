# Pilot Ready Plan

## Goal
Prepare Tetrivo for a closed customer pilot with controlled risk, verifiable security, and stable operations.

## Scope assumptions
- Current codebase as reviewed in AUDIT-2026-01-20.md.
- Supabase, Vercel, Resend, Upstash, and AI providers are in use.
- Pilot is a closed group of early adopters with limited data volume.

## Readiness gates (must pass before pilot)
1. RLS and access control
   - Consolidate profiles UPDATE policies to a single locked policy.
   - Verify active policies in production with pg_policies.
2. Public endpoints
   - /api/contact accessible without auth and protected with rate limit or captcha.
   - /api/health returns 200 using service role or public RPC.
3. Monitoring and incident response
   - Error monitoring (Sentry or equivalent) enabled with alerts.
   - Uptime check for /api/health or synthetic user flow.
4. Privacy and data handling
   - AI data processing disclosure added in UI and privacy text.
   - Retention cleanup automated (pg_cron or scheduled job).

## Workstreams

### 1) Security hardening
- Consolidate RLS for profiles updates and verify in prod.
- Remove client-side audit writes; move to server or DB trigger.
- Review CSP and remove unsafe-inline where possible.
- Add HSTS header.

### 2) Reliability and observability
- Add Sentry (or similar) with environment tags.
- Create health endpoint that does not depend on anon RLS.
- Add structured logging for critical routes (invite, upload, ask, auth).

### 3) Privacy and compliance
- Update privacy text to reflect stored fields (emails in audit logs).
- Document AI processing and DPA status for vendors.
- Confirm GDPR retention schedule and automation.

### 4) Product readiness
- Fix contact form flow to work for anonymous users.
- Verify invite flow and magic links in staging with real email.
- Ensure error pages do not leak sensitive details.

### 5) Pilot execution
- Define pilot success metrics: activation, weekly active use, instruction read confirmations.
- Create a pilot runbook: onboarding, support, escalation, rollback.
- Prepare communication templates (invite, support, outage notice).

## Suggested timeline (aggressive, 2-3 weeks)
- Week 1: Security hardening + contact/health fixes
- Week 2: Observability + privacy updates + retention automation
- Week 3: Staging verification + pilot onboarding

## Verification checklist
- RLS: pg_policies shows only locked profile UPDATE policy.
- /api/contact works without auth and is rate limited.
- /api/health returns 200 on staging and prod.
- Monitoring alerts fire on forced error.
- Retention job executed and logged.

## Pilot exit criteria
- No high or critical findings open.
- Monitoring and incident response tested.
- Privacy text and AI disclosures live.
- Onboarding flow validated end-to-end.
