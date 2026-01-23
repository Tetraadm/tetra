-- Mock Supabase environment for RLS testing
-- This file is run BEFORE consolidated migrations

-- Create extensions schema (Supabase puts extensions here)
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mock auth schema
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

-- Enable pgcrypto for gen_random_uuid() (already in pgvector image)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO PUBLIC;
