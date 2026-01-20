# SQL Konsolidering - Tetrivo HMS

## Filstruktur og kjørerekkefølge

| # | Fil | Formål | Avhengigheter |
|---|-----|--------|---------------|
| 1 | `01_extensions.sql` | PostgreSQL extensions | Ingen |
| 2 | `02_schema.sql` | Alle tabeller, indexes, RLS enabled | 01 |
| 3 | `03_functions.sql` | RPC-funksjoner (SECURITY DEFINER) | 02 |
| 4 | `04_triggers.sql` | Triggers (updated_at, email sync) | 02, 03 |
| 5 | `05_policies.sql` | Alle RLS-policies (single source) | 02, 03 |
| 6 | `06_storage.sql` | Storage bucket og policies | 02 |
| 7 | `07_gdpr.sql` | GDPR retention, DSAR, hard delete | 02, 03 |

---

## Komplett filmapping

### → 01_extensions.sql
| Original fil | Status |
|--------------|--------|
| (ingen direkte) | Extensions fra 01_schema header |

### → 02_schema.sql
| Original fil | Status |
|--------------|--------|
| `01_schema.sql` | Tabeller og basis-RLS |
| `09_ai_unanswered_questions.sql` | ai_unanswered_questions tabell |
| `10_instructions_add_updated_at.sql` | updated_at kolonne |
| `17_add_fk_indexes.sql` | FK-indekser |
| `27_keywords_gin_index.sql` | GIN-indeks for keywords |

### → 03_functions.sql
| Original fil | Status |
|--------------|--------|
| `03_rpc_functions.sql` | get_invite_by_token |
| `04_security_helpers.sql` | get_profile_context, get_user_* |
| `12_accept_invite.sql` | accept_invite |
| `25_read_confirmations_rpc.sql` | get_read_confirmations |
| `26_rpc_security_fix.sql` | Sikkerhetsfikser integrert |

### → 04_triggers.sql
| Original fil | Status |
|--------------|--------|
| `11_rpc_add_updated_at.sql` | update_updated_at_column |
| `23_document_profile_email_trigger.sql` | sync_profile_email |

### → 05_policies.sql (CRITICAL: Single Source of Truth)
| Original fil | Status |
|--------------|--------|
| `01_schema.sql` | Basis-policies |
| `05_policy_updates.sql` | Policy-oppdateringer |
| `06_alerts_policy_fix.sql` | Alerts policies |
| `08_instruction_reads_update_policy_fix.sql` | Instruction reads |
| `14_rls_optimization.sql` | Optimaliserte policies |
| `15_policy_consolidation.sql` | Konsoliderte policies |
| `21_consolidate_policies_final.sql` | Finale policies |
| `30_profiles_update_lock.sql` | **KRITISK**: Field locking |
| `31_profiles_policy_cleanup.sql` | IKKE TRENGS LENGER |

### → 06_storage.sql
| Original fil | Status |
|--------------|--------|
| `07_storage_policies.sql` | Storage read policy |
| `19_storage_policies_complete.sql` | Komplette policies |
| `20_apply_storage_policies.sql` | Apply policies |
| `24_block_direct_client_storage.sql` | Block client writes |

### → 07_gdpr.sql
| Original fil | Status |
|--------------|--------|
| `29_gdpr_retention.sql` | Retention cleanup |
| (NY) | DSAR export function |
| (NY) | Hard delete function |

### SLETTET (ikke lenger nødvendig)
| Original fil | Årsak |
|--------------|-------|
| `00_migrations_table.sql` | Supabase håndterer dette |
| `02_seed.sql` | Ikke nødvendig for produksjon |
| `13_db_advisor_fixes.sql` | Integrert i nye filer |
| `16_drop_unused_indexes.sql` | Integrert |
| `18_soft_delete_audit.sql` | Integrert |
| `22_cleanup_orphaned_functions.sql` | Ikke trengs |

---

## Reset vs Restart - Forklaring

### "Restart Database" (i Supabase Dashboard)
- **Hva det gjør**: Restarter PostgreSQL-prosessen
- **Beholder**: Alt data, tabeller, brukere
- **Bruk**: Ved performance-problemer eller hengende connections

### "Full Reset" (manuell SQL)
- **Hva det gjør**: Sletter hele public schema og all data
- **Sletter**: Alle tabeller, data, funksjoner, policies
- **Beholder**: Environment variables, API keys, project settings
- **Bruk**: Når du vil starte med blank database

### Korrekt reset-prosedyre:

```sql
-- STEG 1: Drop og gjenopprett public schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- STEG 2: Kjør SQL-filene i rekkefølge (se over)
```

**MERK**: auth.users håndteres separat. For å slette brukere:
1. Gå til Supabase Dashboard → Authentication → Users
2. Slett brukere manuelt, eller
3. Bruk Supabase Admin API

---

## Verifiseringsqueries

### 1. Verifiser extensions
```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');
```

### 2. Verifiser tabeller
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### 3. Verifiser RLS er aktivert
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = TRUE
ORDER BY tablename;
```

### 4. Verifiser policies (bør ha ~30+ policies)
```sql
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'USING' ELSE '' END AS has_using,
  CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK' ELSE '' END AS has_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 5. Verifiser ingen dupliserte policies
```sql
SELECT tablename, cmd, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 3
ORDER BY policy_count DESC;
```

### 6. Verifiser funksjoner
```sql
SELECT proname, prosecdef AS security_definer
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;
```

### 7. Verifiser storage policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

### 8. Test GDPR retention (dry run)
```sql
SELECT 
  'audit_logs' AS table_name,
  COUNT(*) AS older_than_90_days
FROM public.audit_logs
WHERE created_at < NOW() - INTERVAL '90 days'
UNION ALL
SELECT 'ask_tetra_logs', COUNT(*)
FROM public.ask_tetra_logs
WHERE created_at < NOW() - INTERVAL '90 days'
UNION ALL
SELECT 'ai_unanswered_questions', COUNT(*)
FROM public.ai_unanswered_questions
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## GDPR-sikkerhet oppsummering

| Krav | Implementasjon |
|------|----------------|
| **Dataminimering** | Kun nødvendige PII-felt (email, full_name) |
| **Lagringsperiode** | 90-dagers retention på logs |
| **Innsynsrett (Art. 15)** | `gdpr_export_user_data()` |
| **Slettingsrett (Art. 17)** | `gdpr_hard_delete_user()` |
| **Tilgangskontroll** | RLS + SECURITY DEFINER + SET search_path |
| **Minste privilegium** | WITH CHECK på alle write-policies |
| **Audit trail** | gdpr_retention_runs tabell |
