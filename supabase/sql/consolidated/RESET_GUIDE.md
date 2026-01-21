# Supabase Database Reset Guide

## Oversikt

Denne guiden beskriver hvordan du resetter og setter opp Tetrivo-databasen på nytt.

---

## Steg 1: Reset Database

### I Supabase Dashboard → SQL Editor, kjør:

```sql
-- ADVARSEL: Dette sletter ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
```

---

## Steg 2: Kjør SQL-filer i rekkefølge

Kopier og lim inn innholdet fra hver fil i SQL Editor:

| # | Fil | Beskrivelse |
|---|-----|-------------|
| 1 | `01_extensions.sql` | PostgreSQL extensions |
| 2 | `02_schema.sql` | Tabeller og indexes |
| 3 | `03_functions.sql` | RPC-funksjoner |
| 4 | `04_triggers.sql` | Triggers |
| 5 | `05_policies.sql` | RLS policies |
| 6 | `06_storage.sql` | Storage bucket |
| 7 | `07_gdpr.sql` | GDPR funksjoner |
| 8 | `08_vector_fix.sql` | Vector search schema (embedding & match) |
| 9 | `09_read_confirmations_rpc.sql` | Read report functions |
| 10 | `10_gdpr_cron.sql` | GDPR cron schedule |

**VIKTIG:** Kjør filene i nøyaktig denne rekkefølgen!

---

## Steg 3: Verifiser

Kjør disse queries for å bekrefte at alt er satt opp riktig:

```sql
-- Sjekk tabeller (bør være 14)
SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';

-- Sjekk at RLS er aktivert
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = TRUE;

-- Sjekk policies (bør være ~35)
SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';

-- Sjekk funksjoner
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
ORDER BY proname;
```

---

## Steg 4: Opprett første organisasjon og admin

```sql
-- Opprett organisasjon
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Min Bedrift')
RETURNING id;

-- Etter at en bruker har logget inn via magic link,
-- opprett admin-profil manuelt:
INSERT INTO public.profiles (id, full_name, email, role, org_id)
VALUES (
  '<USER_ID_FRA_AUTH>',
  'Admin Navn',
  'admin@example.com',
  'admin',
  '00000000-0000-0000-0000-000000000001'
);
```

---

## Feilsøking

### "permission denied for schema public"
Kjør GRANT-statements fra Steg 1 på nytt.

### "function does not exist"
Kjør 03_functions.sql på nytt.

### "policy already exists"
Kjør dette først:
```sql
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;
```
Deretter kjør 05_policies.sql på nytt.
