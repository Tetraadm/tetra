# TODO Next (always current)

Regel:
- Dette er "start her"-fila.
- Hold den kort, konkret og prioritert.
- Øverst = viktigst.

## Top priority (nå)

1. [ ] **Verify soft-delete migration** - run verification queries + manual soft-delete test
2. [ ] **Add pagination to admin queries** — teams, users fetches all rows without limit (instructions/alerts have limits)
3. [ ] **Add storage INSERT/DELETE deny policies** — explicit deny for authenticated users (MÅ-5 from review)

## After that

- [ ] Add explicit `org_wide` boolean flag to instructions (instead of "no team = visible to all")
- [ ] Add GIN index on `keywords` JSONB column for better AI search performance
- [ ] Consider nonce-based CSP to remove `unsafe-inline` dependency
- [ ] Add admin UI to view/restore soft-deleted items
- [ ] Add union types for role/severity/status in types.ts (BØR-3 from review)
- [ ] Split mega-components (EmployeeApp.tsx 1003 lines, AdminDashboard.tsx 531 lines)

## Recently completed

- [x] **Security hardening from CODEBASE_REVIEW** (2026-01-13)
  - Removed token/role/org_id from localStorage in invite flow (MÅ-1)
  - Added magic bytes validation to file uploads (MÅ-2)
  - Improved rate limiting to use user.id instead of IP (MÅ-4)
- [x] **Soft-delete migration applied** - remote DB updated + RPCs filtered (2026-01-13)
- [x] **Soft-delete for instructions, alerts, folders** — migration + RLS + frontend hooks (2026-01-13)
- [x] **Audit logging for alerts, folders, teams** — all CRUD operations now logged (2026-01-13)
- [x] Replace pdf-parse with pdfjs-dist (security fix)
- [x] Remove `unsafe-eval` from CSP (security fix)
- [x] Add CSP headers to next.config.ts (security fix)
- [x] Add `.limit()` to admin page queries (performance)
- [x] Set up AI workflow documentation

## Parking lot (nice-to-have)

- [ ] Dark mode toggle
- [ ] Invite resend/extend functionality
- [ ] Vector embeddings for semantic instruction search



