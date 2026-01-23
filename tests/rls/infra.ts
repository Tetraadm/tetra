import { Pool, PoolClient } from 'pg'
import fs from 'fs'
import path from 'path'

const CONSOLIDATED_SQL_DIR = path.join(process.cwd(), 'supabase', 'sql', 'consolidated')
const MOCK_SQL_FILE = path.join(process.cwd(), 'tests', 'rls', '00_auth_mock.sql')

export const pool = new Pool({
    connectionString: process.env.TEST_DB_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
})

/**
 * Runs a query as a specific user (simulate RLS)
 */
export async function queryAsUser(
    client: PoolClient,
    userId: string | null,
    role: string = 'authenticated',
    query: string,
    params: unknown[] = []
) {
    // Reset session
    // await client.query(`RESET ALL`) // Careful with connection pooling

    // Set claims
    if (userId) {
        await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId])
        await client.query(`SELECT set_config('request.jwt.claim.role', $1, true)`, [role])
    } else {
        // Anon
        await client.query(`SELECT set_config('request.jwt.claim.sub', '', true)`)
        await client.query(`SELECT set_config('request.jwt.claim.role', 'anon', true)`)
    }

    // Execute
    return client.query(query, params)
}

/**
 * Applies all migrations to the test database
 */
export async function applyMigrations() {
    const client = await pool.connect()
    try {
        // Drop all to start fresh (DANGEROUS: Only use on test DB)
        await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `)

        // Apply auth mock
        const authMock = fs.readFileSync(MOCK_SQL_FILE, 'utf8')
        await client.query(authMock)

        // Apply consolidated SQLs in order
        const files = fs.readdirSync(CONSOLIDATED_SQL_DIR).sort()
        for (const file of files) {
            if (!file.endsWith('.sql')) continue
            console.log(`Applying ${file}...`)
            const sql = fs.readFileSync(path.join(CONSOLIDATED_SQL_DIR, file), 'utf8')

            // Basic splitting by statement might be needed if pg driver doesn't support multi-statement well?
            // pg driver SUPPORTS multi-statement strings.
            try {
                await client.query(sql)
            } catch (e: unknown) {
                const errMsg = e instanceof Error ? e.message : String(e)
                console.error(`Error applying ${file}:`, errMsg)
                throw e
            }
        }
    } finally {
        client.release()
    }
}
