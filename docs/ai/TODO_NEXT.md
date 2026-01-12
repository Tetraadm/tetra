# TODO Next (always current)

Regel:
- Dette er "start her"-fila.
- Hold den kort, konkret og prioritert.
- Øverst = viktigst.

## Top priority (nå)

1. [ ] **Add pagination to admin queries** — teams, users, instructions, alerts fetches all rows without limit (performance risk for large orgs)
2. [ ] **Add soft delete for instructions** — deleting instructions removes audit trail (compliance risk)
3. [ ] **Verify login rate limiting** — confirm Supabase has built-in OTP brute-force protection

## After that

- [ ] Add explicit `org_wide` boolean flag to instructions (instead of "no team = visible to all")
- [ ] Add GIN index on `keywords` JSONB column for better AI search performance
- [ ] Consider nonce-based CSP to remove `unsafe-inline` dependency

## Recently completed

- [x] Remove `unsafe-eval` from CSP (security fix)
- [x] Set up AI workflow documentation

## Parking lot (nice-to-have)

- [ ] Dark mode toggle
- [ ] Invite resend/extend functionality
- [ ] Vector embeddings for semantic instruction search
