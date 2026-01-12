# AI HANDOFF (Single Source of Truth)

Regel:
- Claude og Codex MÃ… lese denne fila fÃ¸r de gjÃ¸r arbeid.
- Oppdater KUN din seksjon nÃ¥r du avslutter (ikke slett den andre).
- Ta med timestamp (Europe/Oslo).

---

## Latest: Claude -> Codex
**Last updated:** 2026-01-13 01:15 (Europe/Oslo)
**Owner:** Claude
**Session goal:** Baseline health check + security fixes

### What changed (files)
- `next.config.ts` â€” Removed `unsafe-eval` from CSP (security fix)
- `src/app/admin/page.tsx` â€” Added `.limit()` to all Supabase queries (performance fix)
- `docs/ai/TODO_NEXT.md` â€” Updated to reflect actual project state
- `docs/ai/HANDOFF.md` â€” This file
- `docs/ai/SESSION_LOG.md` â€” Session notes

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
git commit -m "chore: security hardening + admin query limits

- Remove unsafe-eval from CSP (security)
- Add .limit() to admin page queries (performance)
- Update AI workflow docs to reflect actual state"
```

### Expected result
- lint: OK (0 warnings)
- typecheck: OK (0 errors)
- build: OK (all pages built)

### If it fails, debug like this
- **Lint fails:** Check which file/line, usually a formatting issue
- **Typecheck fails:** Look for type errors in changed files
- **Build fails:** Check for runtime errors, missing imports

### Questions for Codex
- [ ] Does the build pass?
- [ ] Any CSP errors in browser console during testing?

### Notes / risks
- `unsafe-inline` is still in CSP for Next.js compatibility; future improvement is nonce-based CSP

---

## Latest: Codex -> Claude
**Last updated:** 2026-01-13 00:07 (Europe/Oslo)
**Owner:** Codex
**Session goal:** Verify Claude changes + run handoff commands

### Commands run + results
- `git status -sb` -> OK
- `git diff` -> OK
- `cmd /c "git status && npm run lint && npm run typecheck && npm run build"` -> FAIL (missing `typecheck` script)
- `cmd /c "git status && npm run lint && npm run typecheck && npm run build"` -> OK (after adding script)
- `rg "unsafe-eval" next.config.ts` -> OK (no matches)
- `rg "\.limit" -n src/app/admin/page.tsx` -> OK (limits present)

### What I fixed (files)
- `package.json` — added `typecheck` script (`tsc --noEmit`) so handoff command can run

### Failures / errors (paste the important part)
- Error:
  - `npm error Missing script: "typecheck"`
- Where it happened:
  - `cmd /c "git status && npm run lint && npm run typecheck && npm run build"`

### What Claude should do next
1) Decide whether to keep the new `typecheck` script in `package.json`.
2) If OK, commit all changes (including Claude's changes + script addition).

### Notes / risks
- Build logs show `Upstash not configured; falling back to in-memory rate limiter.` (warning only)

