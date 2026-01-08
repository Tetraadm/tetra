# 🚀 Demo Setup på Vercel - Rask Guide

## Steg-for-steg (5 minutter)

### 1. Kjør SQL i Supabase
1. Gå til **Supabase Dashboard → SQL Editor**
2. Åpne filen: `supabase/demo-seed.sql`
3. Copy-paste **hele** filen inn i SQL Editor
4. Klikk **Run** (dette oppretter org, teams, mapper og 10 instrukser)

### 2. Opprett Auth-brukere
1. Gå til **Supabase Dashboard → Authentication → Users**
2. Klikk **"Add user" → "Create new user"**

**Admin-bruker:**
- Email: `admin@demo.no`
- Password: `Demo2024!`
- ✅ Auto Confirm User: **JA**
- Kopier **User ID** (trenger dette i neste steg)

**Ansatt-bruker:**
- Email: `lars.hansen@demo.no`
- Password: `Demo2024!`
- ✅ Auto Confirm User: **JA**
- Kopier **User ID**

### 3. Koble profiler til auth-brukere
Gå tilbake til **SQL Editor** og kjør:

```sql
-- Erstatt USER_ID verdiene med de du kopierte over

-- Admin profil
INSERT INTO profiles (id, full_name, role, org_id, team_id) VALUES
('DIN_ADMIN_USER_ID', 'Admin Demo', 'admin', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004');

-- Lars Hansen profil
INSERT INTO profiles (id, full_name, role, org_id, team_id) VALUES
('DIN_LARS_USER_ID', 'Lars Hansen', 'employee', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
```

### 4. (Valgfritt) Legg til audit logs og lesebekreftelser

```sql
-- Audit logs (20 random hendelser)
INSERT INTO audit_logs (org_id, user_id, action_type, entity_type, entity_id, details, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'DIN_ADMIN_USER_ID',
  'publish_instruction',
  'instruction',
  '30000000-0000-0000-0000-000000000001',
  '{"instruction_title": "Demo Instruks"}'::jsonb,
  NOW() - (random() * interval '30 days')
FROM generate_series(1, 20);

-- Lesebekreftelser for Lars
INSERT INTO instruction_reads (instruction_id, user_id, org_id, read_at, confirmed_at, confirmed) VALUES
('30000000-0000-0000-0000-000000000001', 'DIN_LARS_USER_ID', '00000000-0000-0000-0000-000000000001', NOW() - interval '5 days', NOW() - interval '5 days', true),
('30000000-0000-0000-0000-000000000002', 'DIN_LARS_USER_ID', '00000000-0000-0000-0000-000000000001', NOW() - interval '3 days', NOW() - interval '3 days', true);
```

### 5. Logg inn!

Gå til: `https://din-app.vercel.app/demo`

Eller direkte login: `https://din-app.vercel.app/login`
- **Admin**: `admin@demo.no` / `Demo2024!`
- **Ansatt**: `lars.hansen@demo.no` / `Demo2024!`

## ✅ Hva du nå har:

- ✅ 1 demo organisasjon (Demo Bedrift AS)
- ✅ 4 teams
- ✅ 6 mapper
- ✅ 10 HMS-instrukser med keywords
- ✅ 2 demo-brukere (admin + ansatt)
- ✅ 20 historiske audit logs
- ✅ Noen lesebekreftelser

## 🎬 Demo-scenarioer

### Som Admin:
1. Se **Aktivitetslogg** med 20 hendelser
2. Se **Lesebekreftelser** → utvid instruks for detaljer
3. Eksporter **CSV** rapport
4. Opprett ny instruks → se at keywords genereres automatisk

### Som Ansatt:
1. Åpne instruks → Klikk **"Jeg har lest og forstått"**
2. Gå til **"Spør Tetra"** → Spør: "Hva gjør jeg ved brann?"
3. Se hvordan AI filtrerer til relevante instrukser

## 🧹 Rydd opp

Hvis du vil starte på nytt:

```sql
DELETE FROM instruction_reads WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM audit_logs WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM instructions WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM folders WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM profiles WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM teams WHERE org_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';

-- Slett også auth-brukerne i Authentication → Users
```

Deretter kjør `demo-seed.sql` på nytt!
