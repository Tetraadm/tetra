import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const CHECKS = [
  { file: 'supabase/sql/consolidated/01_extensions.sql', migration: '01_extensions' },
  { file: 'supabase/sql/consolidated/02_schema.sql', migration: '02_schema' },
  { file: 'supabase/sql/consolidated/03_functions.sql', migration: 'sync_03_functions' },
  { file: 'supabase/sql/consolidated/04_triggers.sql', migration: 'sync_04_triggers' },
  { file: 'supabase/sql/consolidated/05_policies.sql', migration: 'sync_05_policies' },
  { file: 'supabase/sql/consolidated/06_storage.sql', migration: 'sync_06_storage' },
  { file: 'supabase/sql/consolidated/07_gdpr.sql', migration: 'sync_07_gdpr' },
  { file: 'supabase/sql/consolidated/08_vector_fix.sql', migration: '08_vector_fix' },
  { file: 'supabase/sql/consolidated/09_read_confirmations_rpc.sql', migration: 'sync_09_read_confirmations_rpc' },
  { file: 'supabase/sql/consolidated/09_instruction_chunks.sql', migration: '09_instruction_chunks' },
  { file: 'supabase/sql/consolidated/10_gdpr_cron.sql', migration: '10_gdpr_cron' },
  { file: 'supabase/sql/consolidated/11_gdpr_requests.sql', migration: 'sync_11_gdpr_requests' },
  { file: 'supabase/sql/consolidated/12_soft_delete.sql', migration: '12_soft_delete' }
]

const EXTRA_LOCAL = [
  'supabase/sql/seed/pilot_seed_data.sql',
  'tests/rls/00_auth_mock.sql'
]

const WORKSPACE_ROOT = process.cwd()

const normalizeSql = (sql) => {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const hashText = (text) => {
  return crypto.createHash('md5').update(text).digest('hex')
}

const hashFile = (filePath) => {
  const absolutePath = path.resolve(WORKSPACE_ROOT, filePath)
  const raw = fs.readFileSync(absolutePath, 'utf8')
  return hashText(normalizeSql(raw))
}

const hashStatements = (statements) => {
  const joined = Array.isArray(statements) ? statements.join('\n') : String(statements || '')
  return hashText(normalizeSql(joined))
}

const getLatestMigrations = async (names) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data, error } = await supabase
    .schema('supabase_migrations')
    .from('schema_migrations')
    .select('name, version, statements')
    .in('name', names)

  if (error) {
    throw new Error(`Failed to fetch supabase migrations: ${error.message}`)
  }

  const latest = new Map()
  for (const row of data || []) {
    const current = latest.get(row.name)
    if (!current || row.version > current.version) {
      latest.set(row.name, row)
    }
  }

  return latest
}

const main = async () => {
  console.log('SQL sync check')

  const migrationNames = CHECKS.map((entry) => entry.migration)
  const latest = await getLatestMigrations(migrationNames)

  let matches = 0
  let mismatches = 0
  let missing = 0

  for (const entry of CHECKS) {
    const localHash = hashFile(entry.file)
    const remote = latest.get(entry.migration)

    if (!remote) {
      missing += 1
      console.log(`[MISSING] ${entry.file} -> ${entry.migration}`)
      continue
    }

    const remoteHash = hashStatements(remote.statements)

    if (localHash === remoteHash) {
      matches += 1
      console.log(`[OK] ${entry.file} -> ${entry.migration} (${remote.version})`)
    } else {
      mismatches += 1
      console.log(`[MISMATCH] ${entry.file} -> ${entry.migration} (${remote.version})`)
      console.log(`  local:  ${localHash}`)
      console.log(`  remote: ${remoteHash}`)
    }
  }

  if (EXTRA_LOCAL.length > 0) {
    console.log('\nUntracked SQL files (no migration check):')
    for (const filePath of EXTRA_LOCAL) {
      console.log(`- ${filePath}`)
    }
  }

  console.log(`\nSummary: ${matches} match, ${mismatches} mismatch, ${missing} missing`)

  if (mismatches > 0 || missing > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
