-- Mock Supabase Auth environment
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY,
    email text UNIQUE,
    raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Mock session variables functions
-- In Supabase, these are provided by the GoTrue/PostgREST environment.
-- In standard Postgres, we can simulate them using specific settings or a mock function.

-- Mock auth.uid() to read from a transaction-local setting 'request.jwt.claim.sub'
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE SQL STABLE;

-- Mock auth.role()
CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
    SELECT COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        'anon'
    )::text;
$$ LANGUAGE SQL STABLE;

-- Mock basic extensions if they are expected (pgcrypto usually handled by 01_extensions)
-- vector is handled by 01_extensions too.
