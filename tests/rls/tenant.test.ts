import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { pool, applyMigrations, queryAsUser } from './infra'
import { v4 as uuidv4 } from 'uuid'

// Test Data
const orgA_id = uuidv4()
const orgB_id = uuidv4()

const userAdminA_id = uuidv4()
const userMemberA_id = uuidv4()
const userAdminB_id = uuidv4()

const teamA1_id = uuidv4()
const teamB1_id = uuidv4()

describe('Multi-tenant RLS', () => {
    beforeAll(async () => {
        // 1. Reset DB and apply migrations
        await applyMigrations()

        const client = await pool.connect()
        try {
            // 2. Seed Auth Users (Mock)
            await client.query(`
        INSERT INTO auth.users (id, email) VALUES
        ($1, 'adminA@test.com'),
        ($2, 'memberA@test.com'),
        ($3, 'adminB@test.com')
      `, [userAdminA_id, userMemberA_id, userAdminB_id])

            // Seed Public Data (Service Role / Postgres Admin)

            // Orgs
            await client.query(`INSERT INTO public.organizations (id, name) VALUES ($1, 'Org A'), ($2, 'Org B')`, [orgA_id, orgB_id])

            // Teams
            await client.query(`INSERT INTO public.teams (id, name, org_id) VALUES ($1, 'Team A1', $2), ($3, 'Team B1', $4)`, [teamA1_id, orgA_id, teamB1_id, orgB_id])

            // Profiles
            await client.query(`
        INSERT INTO public.profiles (id, full_name, email, role, org_id) VALUES
        ($1, 'Admin A', 'adminA@test.com', 'admin', $2),
        ($3, 'Member A', 'memberA@test.com', 'employee', $2),
        ($4, 'Admin B', 'adminB@test.com', 'admin', $5)
      `, [userAdminA_id, orgA_id, userMemberA_id, userAdminB_id, orgB_id])

            // Assign MemberA to Team A1
            await client.query(`UPDATE public.profiles SET team_id = $1 WHERE id = $2`, [teamA1_id, userMemberA_id])

        } finally {
            client.release()
        }
    }, 60000) // Increase timeout for migrations

    afterAll(async () => {
        await pool.end()
    })

    it('should isolate instructions between organizations', async () => {
        const client = await pool.connect()
        try {
            const instructionA_id = uuidv4()

            // Admin A creates instruction
            await queryAsUser(client, userAdminA_id, 'authenticated', `
        INSERT INTO public.instructions (id, title, status, severity, org_id, content)
        VALUES ($1, 'Instruction A', 'published', 'medium', $2, 'Content A')
      `, [instructionA_id, orgA_id])

            // Admin B tries to read it
            const resB = await queryAsUser(client, userAdminB_id, 'authenticated', `
        SELECT * FROM public.instructions WHERE id = $1
      `, [instructionA_id])

            expect(resB.rows.length).toBe(0)

            // Admin A reads it
            const resA = await queryAsUser(client, userAdminA_id, 'authenticated', `
        SELECT * FROM public.instructions WHERE id = $1
      `, [instructionA_id])

            expect(resA.rows.length).toBe(1)
        } finally {
            client.release()
        }
    })

    it('should enforce team access logic for published instructions', async () => {
        const client = await pool.connect()
        try {
            const openInstructionId = uuidv4()
            const teamInstructionId = uuidv4()

            // Insert as Admin A (bypassing RLS or using admin RLS which allows insert)
            // Note: Admin insert usually requires specifying org_id matching profile.

            // 1. Instruction visible to WHOLE org (no teams linked)
            await queryAsUser(client, userAdminA_id, 'authenticated', `
        INSERT INTO public.instructions (id, title, status, severity, org_id)
        VALUES ($1, 'Open Doc', 'published', 'low', $2)
      `, [openInstructionId, orgA_id])

            // 2. Instruction limited to Team A1
            await queryAsUser(client, userAdminA_id, 'authenticated', `
        INSERT INTO public.instructions (id, title, status, severity, org_id)
        VALUES ($1, 'Team Doc', 'published', 'critical', $2)
      `, [teamInstructionId, orgA_id])

            // Link to team
            await queryAsUser(client, userAdminA_id, 'authenticated', `
        INSERT INTO public.instruction_teams (instruction_id, team_id)
        VALUES ($1, $2)
      `, [teamInstructionId, teamA1_id])

            // Member A is in Team A1. Should see both.
            const resMember = await queryAsUser(client, userMemberA_id, 'authenticated', `
        SELECT id FROM public.instructions WHERE org_id = $1 ORDER BY title
      `, [orgA_id])

            const ids = resMember.rows.map(r => r.id)
            expect(ids).toContain(openInstructionId)
            expect(ids).toContain(teamInstructionId)

            // Now remove Member A from team A1 (simulate another user Member A2 who is teamless)
            const userMemberA2_id = uuidv4()
            await client.query(`INSERT INTO auth.users (id, email) VALUES ($1, 'a2@t.com')`, [userMemberA2_id])
            await client.query(`INSERT INTO public.profiles (id, full_name, role, org_id) VALUES ($1, 'A2', 'employee', $2)`, [userMemberA2_id, orgA_id])

            // Member A2 (teamless) should see Open Doc, but NOT Team Doc?
            // Logic:
            // (p.team_id IS NOT NULL AND EXISTS... match team)
            // OR NOT EXISTS (instruction_teams) -> if no teams linked, everyone sees.

            // Member A2 has team_id NULL.
            // So (p.team_id IS NOT NULL ...) is FALSE.
            // So they only rely on "OR NOT EXISTS (instruction_teams)".
            // Open Doc has NOT EXISTS instruction_teams -> Visible.
            // Team Doc HAS EXISTS instruction_teams -> Not Visible.

            const resA2 = await queryAsUser(client, userMemberA2_id, 'authenticated', `
        SELECT id FROM public.instructions WHERE org_id = $1
      `, [orgA_id])

            const idsA2 = resA2.rows.map(r => r.id)
            expect(idsA2).toContain(openInstructionId)
            expect(idsA2).not.toContain(teamInstructionId)

        } finally {
            client.release()
        }
    })

    it('should filter soft-deleted instructions', async () => {
        const client = await pool.connect()
        try {
            const deletedId = uuidv4()

            await queryAsUser(client, userAdminA_id, 'authenticated', `
        INSERT INTO public.instructions (id, title, status, severity, org_id, deleted_at)
        VALUES ($1, 'Deleted Doc', 'published', 'low', $2, NOW())
      `, [deletedId, orgA_id])

            // Should not be visible
            const res = await queryAsUser(client, userAdminA_id, 'authenticated', `
        SELECT * FROM public.instructions WHERE id = $1
      `, [deletedId])

            expect(res.rows.length).toBe(0)

        } finally {
            client.release()
        }
    })
})
