# TODO NEXT

**Last Updated:** 2026-01-14 (After BATCH 5)
**Focus:** Technical Stability & Security before major Feature Expansion.

## ✅ COMPLETED (BATCH 5)
**Modaler/Dialoger til Nordic Technical:**
- Alle 8 modaler redesignet med nt-* klasser
- Fjernet avhengighet av createAdminStyles
- Konsistent design med blur backdrop, nt-card, CSS variables
- Verifisering: lint, typecheck, build OK

## Priority 1: Critical Technical Debt
1.  **Server-side Pagination:**
    -   *Why:* `teams` and `users` queries fetch ALL rows. This will crash with data growth.
    -   *Where:* `src/app/admin/hooks/` and corresponding API routes.
2.  **Storage Policies (Security):**
    -   *Why:* Need explicit DENY policies for INSERT/DELETE on storage for unauthorized users (MÅ-5 from review).
    -   *Ref:* See `supabase/policies` (check if exists).
3.  **Refactor Mega-Components (BATCH 8 - NESTE BATCH):**
    -   *Why:* `EmployeeApp.tsx` (1202 lines) and `AdminDashboard.tsx` (552 lines) er store og komplekse.
    -   *Status:* EmployeeApp redesignet i BATCH 7, men fortsatt én stor fil.
    -   *Action:* Split into smaller, atomic components:
        * **EmployeeApp.tsx** → Split til:
          - `components/EmployeeHeader.tsx` (header med logo, avatar)
          - `components/QuickActions.tsx` (3 quick action cards)
          - `components/ActiveAlerts.tsx` (varsler-seksjon)
          - `components/CriticalInstructions.tsx` (kritiske instrukser-seksjon)
          - `components/LatestInstructions.tsx` (siste instrukser-seksjon)
          - `components/InstructionsTab.tsx` (søk + liste)
          - `components/AskTetraTab.tsx` (chat med empty state, messages, input)
          - `components/InstructionModal.tsx` (overlay med confirm read)
          - `components/BottomNav.tsx` (mobil navigation)
        * **AdminDashboard.tsx** → Split til:
          - Tabs er allerede splittet (OverviewTab, UsersTab, TeamsTab osv.)
          - Modaler er allerede splittet (modals.tsx)
          - Gjenstående: AppShell layout-komponenter

## Priority 2: Type Safety & Performance
4.  **Fix `any` / Loose Types:**
    -   *Action:* Introduce proper Union types for `role` ('admin' | 'leader' | 'employee'), `severity`, and `status` in `src/lib/types.ts`.
5.  **Database Indexing:**
    -   *Action:* Add GIN index on `keywords` JSONB column for AI search performance.

## Priority 3: Features / UX
-   **Dark Mode:** Toggle implementation.
-   **Restore Deleted Items:** Admin UI to view/restore soft-deleted entities.
