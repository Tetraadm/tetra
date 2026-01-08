# Supabase Database Migrations

## How to Run Migrations

These migrations add enterprise features to Tetra:
1. Audit logging for critical admin actions
2. Read confirmation tracking for instructions
3. Keyword support for improved AI retrieval

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the content of each migration file in order:
   - `001_create_audit_logs.sql`
   - `002_create_instruction_reads.sql`
   - `003_add_keywords_to_instructions.sql`
5. Run each query

### Option 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
# Run all migrations
supabase db push

# Or run individually
supabase db execute --file supabase/migrations/001_create_audit_logs.sql
supabase db execute --file supabase/migrations/002_create_instruction_reads.sql
supabase db execute --file supabase/migrations/003_add_keywords_to_instructions.sql
```

## Verification

After running migrations, verify in Supabase Dashboard:

1. Check that tables exist:
   - `audit_logs`
   - `instruction_reads`

2. Check that `instructions` table has new column:
   - `keywords` (JSONB)

3. Verify RLS policies are enabled for new tables

4. Test RLS policies by running queries as different user roles

## Rollback

If you need to rollback these changes:

```sql
-- Remove keywords column
ALTER TABLE instructions DROP COLUMN keywords;

-- Drop instruction_reads table
DROP TABLE IF EXISTS instruction_reads CASCADE;

-- Drop audit_logs table
DROP TABLE IF EXISTS audit_logs CASCADE;
```

**WARNING:** Rolling back will permanently delete all audit logs and read confirmation data.
