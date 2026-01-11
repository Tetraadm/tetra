# Codex Handoff - Tetra

Repo
- Path: C:\Users\xboxs\Documents\tetra
- This file is a summary so a new Codex session can continue.

Supabase / MCP
- Project ref: rshukldzekufrlkbsqrr
- MCP auth works; Supabase tool calls succeed.
- Security advisor: leaked password protection disabled (dashboard setting).
- Performance advisor: unused index warnings for FK indexes only (expected on low traffic).

Work done
- Admin modals accessibility added in `src/app/admin/components/modals.tsx`:
  - role="dialog", aria-modal, aria-labelledby
  - Escape closes modal, focus trap, auto-focus
  - text cleanup in modal copy
- Migrations applied in Supabase:
  - `14_rls_optimization`: my_org_id() + simplified policies
  - `15_policy_consolidation`: merged select/update policies; admin manage split into insert/update/delete
  - `16_drop_unused_indexes`: dropped non-FK indexes (keywords/severity/file_path)
  - `17_add_fk_indexes`: restored FK indexes to avoid unindexed FK warnings
- SQL files added:
  - `supabase/sql/15_policy_consolidation.sql`
  - `supabase/sql/16_drop_unused_indexes.sql`
  - `supabase/sql/17_add_fk_indexes.sql`
- Advisors run after migrations (security + performance).
- Claude changes:
  - README version bump (Next.js 16/React 19), typo fix in ai-qa-test.md, tetra-chatgpt log update.
  - Removed empty `src/components/ui` folder.
  - `npm run lint`, `npx tsc --noEmit`, `npm run build` all green.

Pending tasks
1) Decide whether to enable leaked password protection in Supabase Auth dashboard.
2) Optional: decide if `grant execute on function public.my_org_id()` should be restricted to authenticated.
3) Optional: revisit unused index warnings after traffic; they are FK indexes kept for safety.

Notes
- Multiple permissive policy warnings are resolved via consolidated policies.
- PDF upload flow: `src/app/api/upload/route.ts` extracts text from PDF if content is empty.
