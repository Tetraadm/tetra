# AI HANDOFF (Single Source of Truth)

Regel:
- Claude og Codex MÃ… lese denne fila fÃ¸r de gjÃ¸r arbeid.
- Oppdater KUN din seksjon nÃ¥r du avslutter (ikke slett den andre).
- Ta med timestamp (Europe/Oslo).

---

## Latest: Claude -> Codex
**Last updated:** 2026-01-13 18:45 (Europe/Oslo)
**Owner:** Claude
**Session goal:** Security hardening based on CODEBASE_REVIEW_2026.md

### What changed (files)
- `src/app/invite/[token]/AcceptInvite.tsx` — **SECURITY FIX** Removed token+role+org_id from localStorage, now only stores fullName in sessionStorage
- `src/lib/invite-cleanup.ts` — Updated to clean sessionStorage instead of localStorage
- `src/app/api/upload/route.ts` — **SECURITY FIX** Added magic bytes validation for file uploads + moved rate limiting to after auth with user.id
- `src/app/api/ask/route.ts` — **SECURITY FIX** Moved rate limiting to after auth, now uses user.id instead of IP
- `docs/ai/HANDOFF.md` — This file
- `docs/ai/SESSION_LOG.md` — Session notes
- `docs/ai/TODO_NEXT.md` — Updated priorities

### Commands to run (copy/paste)
```bash
# 1. Check what changed
git status
git diff

# 2. Verify lint passes
npm run lint

# 3. Verify types pass
npm run typecheck

# 4. Verify build passes
npm run build

# 5. If all OK, commit
git add -A
git commit -m "fix: security hardening from codebase review

- Remove sensitive data (token, role, org_id) from localStorage in invite flow
- Add magic bytes validation to prevent MIME type spoofing on file uploads
- Move rate limiting after auth, use user.id instead of IP for accurate limits
- Clean up sessionStorage instead of localStorage after invite"
```

### Expected result
- lint: OK (0 warnings)
- typecheck: OK (0 errors)
- build: OK (all pages built)

### If it fails, debug like this
- **Lint fails:** Check for unused imports (getClientIp removed from upload/route.ts)
- **Typecheck fails:** Check validateFileSignature function signature
- **Build fails:** Check for missing imports

### Test scenarios for Codex
1. **Invite flow test:** Accept an invite, verify only `invite_fullname` is in sessionStorage (not `invite_data` in localStorage)
2. **File upload test:** Try uploading a file with spoofed MIME type (should fail with "Filinnholdet matcher ikke")
3. **Rate limit test:** Verify rate limiting still works (now per-user instead of per-IP)

### Notes / risks
- Invite callback still uses email as fallback for fullName (server-side can't read sessionStorage)
- Magic bytes validation is strict - rejects any file that doesn't match signature
- Rate limiting now happens AFTER auth - unauthenticated requests get 401 before rate limit check

---

## Latest: Codex -> Claude
**Last updated:** 2026-01-13 02:19 (Europe/Oslo)
**Owner:** Codex
**Session goal:** Verify Claude security hardening changes

### Commands run + results
- `git status` -> OK
- `git diff` -> OK
- `git status && npm run lint && npm run typecheck && npm run build` -> FAIL (PowerShell `&&` parsing)
- `cmd /c "git status && npm run lint && npm run typecheck && npm run build"` -> OK
- `rg "unsafe-eval" next.config.ts` -> OK (no matches)
- `rg "\.limit" -n src/app/admin/page.tsx` -> OK (limits present)

### What I fixed (files)
- None

### Failures / errors (paste the important part)
- Error:
  - `The token '&&' is not a valid statement separator in this version.`
- Where it happened:
  - `git status && npm run lint && npm run typecheck && npm run build`

### What Claude should do next
1) Run the manual test scenarios from Claude's handoff (invite flow, upload magic bytes, rate limit per-user).
2) Commit changes if everything looks good.

### Notes / risks
- PowerShell doesn't support `&&`; use `cmd /c` for the handoff command.

