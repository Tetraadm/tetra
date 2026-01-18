# PLAN: Internal Admin Tech Demo

## 1. Goal & Context
**Objective:** Prepare Tetra for an **Internal Technical Demo** focusing on the Admin Panel.
**Target Audience:** Internal Stakeholders / Dev Team.
**Key Constraint:** Must be stable, performant, and populated with realistic **Dummy Data**.

## 2. Scope of Work

### Phase 1: Foundation & Data Seeding
*Target: Ensure the app looks "alive" during the demo.*
- [ ] **Database Reset & Seed Script**: Create a robust seeding script (`scripts/seed_demo_data.ts`) to populate the DB with:
    - 1 Admin User (you)
    - 2 Organizations
    - 10 Employees per Org
    - 5 Active Tasks with sample logs
- [ ] **Environment Check**: Verify `.env.local` is configured for local/preview execution.

### Phase 2: User Flow Verification (Critical Path)
*Target: No "Red Screens of Death" during the demo.*
- [ ] **Auth Flow**: Verify `Magic Link` login works 100% of the time.
- [ ] **Admin Dashboard**: Ensure `/admin` loads < 1s with seed data.
- [ ] **User Management**: Verify "Add User" and "List Users" execute without error.
- [ ] **Error Handling**: Ensure 404/500 pages are branded (soft failure).

### Phase 3: Polish & Performance
*Target: "Wow" factor.*
- [ ] **Loading States**: Verify skeletons/spinners appear during data fetch.
- [ ] **Mobile Responsiveness**: Sanity check on mobile view (even if Admin is desktop-first).

## 3. Verification Checklist

### Automated Checks
- [ ] `python scripts/checklist.py .` (Full Audit)
- [ ] `npm run lint` (0 errors)
- [ ] `npm run build` (Clean build)

### Manual Demo Script (The "Happy Path")
1. **Login**: Enter email -> Click magic link -> Redirect to Home.
2. **Dashboard**: View high-level stats (Org count, Active users).
3. **Drill-down**: Click an Organization -> See Employee list.
4. **Action**: "Invite Employee" -> Verify UI feedback (Toast).
5. **Logout**: Clean session termination.

## 4. Agent Assignments
- **Database/Seeding**: `backend-specialist`
- **UI Polish/Components**: `frontend-specialist`
- **Verification/Audit**: `orchestrator`
