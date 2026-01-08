-- ============================================
-- TETRA DEMO SEED - Kjør dette i Supabase SQL Editor
-- ============================================
-- Dette scriptet oppretter komplett demo-miljø med:
-- - 1 organisasjon
-- - 4 teams
-- - 6 mapper
-- - 20 HMS-instrukser
-- - 50 audit logs
-- - Lesebekreftelser
--
-- VIKTIG: Du må manuelt opprette auth-brukere etterpå!
-- ============================================

-- 1. Opprett demo organisasjon
INSERT INTO organizations (id, name, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Bedrift AS', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Opprett teams
INSERT INTO teams (id, name, org_id, created_at) VALUES
('10000000-0000-0000-0000-000000000001', 'Lager', '00000000-0000-0000-0000-000000000001', NOW()),
('10000000-0000-0000-0000-000000000002', 'Produksjon', '00000000-0000-0000-0000-000000000001', NOW()),
('10000000-0000-0000-0000-000000000003', 'Butikk', '00000000-0000-0000-0000-000000000001', NOW()),
('10000000-0000-0000-0000-000000000004', 'Administrasjon', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Opprett mapper
INSERT INTO folders (id, name, org_id, created_at) VALUES
('20000000-0000-0000-0000-000000000001', 'Brann og Evakuering', '00000000-0000-0000-0000-000000000001', NOW()),
('20000000-0000-0000-0000-000000000002', 'Maskinsikkerhet', '00000000-0000-0000-0000-000000000001', NOW()),
('20000000-0000-0000-0000-000000000003', 'Kjemisk Håndtering', '00000000-0000-0000-0000-000000000001', NOW()),
('20000000-0000-0000-0000-000000000004', 'Førstehjelpsutstyr', '00000000-0000-0000-0000-000000000001', NOW()),
('20000000-0000-0000-0000-000000000005', 'Personlig Verneutstyr', '00000000-0000-0000-0000-000000000001', NOW()),
('20000000-0000-0000-0000-000000000006', 'Generelle HMS-rutiner', '00000000-0000-0000-0000-000000000001', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Opprett instrukser (20 stk med keywords)
INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords, created_at) VALUES

-- Kritiske instrukser
('30000000-0000-0000-0000-000000000001', 'Brannrutiner og evakueringsplan',
'BRANNRUTINER

VED OPPDAGELSE AV BRANN:
1. Varsle - Slå brannalarm eller ring 110
2. Evakuer - Forlat bygget via nærmeste utgang
3. Bekjemp - Kun hvis brannen er liten og det er trygt

EVAKUERING:
- Gå rolig til nærmeste nødutgang
- IKKE bruk heis
- Samle på oppsamlingsplass utenfor bygget
- Ikke gå tilbake før brannvesenet sier det er trygt

OPPSAMLINGSPLASS:
Parkeringsplassen ved hovedinngangen

BRANNSLUKNINGSUTSTYR:
Pulverapparat: Til brann i faste stoffer, væsker og elektrisk utstyr
Skumslukker: Til væskebrann
Brannslange: Til større branner

Kontroller at du vet hvor nærmeste brannslukkingsutstyr er plassert.',
'critical', 'published', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
'["brann", "evakuering", "alarm", "nødutgang", "slukkeutstyr", "brannvesen", "pulverapparat", "skumslukker"]'::jsonb, NOW()),

('30000000-0000-0000-0000-000000000002', 'Bruk av gaffeltruck - sikkerhetsrutiner',
'SIKKERHETSRUTINER FOR GAFFELTRUCK

FØR BRUK:
- Sjekk at trucken er i god stand
- Kontroller dekk, lys og horn
- Test bremser
- Sjekk hydraulikksystem

UNDER KJØRING:
- Bruk alltid sikkerhetsbelte
- Kjør i moderat hastighet
- Hold oversikt over omgivelsene
- Bruk horn ved kryssinger og blinde hjørner

LØFTING AV LAST:
- Maksimal lastevekt: 2000 kg
- Sørg for stabil og balansert last
- Kjør med gafler lavt (10-15 cm fra gulv)
- Se oppover når du rygger

PARKERING:
- Senk gafler til gulvet
- Trekk parkeringsbremsen
- Ta ut nøkkelen
- Blokker hjul ved parkering i skråning

KUN SERTIFISERTE OPERATØRER MAY OPERATE TRUCKEN',
'critical', 'published', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
'["gaffeltruck", "truck", "sikkerhet", "løfting", "sertifisering", "maskin", "parkering", "hydraulikk"]'::jsonb, NOW()),

('30000000-0000-0000-0000-000000000003', 'Håndtering av farlige kjemikalier',
'RUTINER FOR HÅNDTERING AV FARLIGE KJEMIKALIER

GENERELLE REGLER:
- Les alltid sikkerhetsdatablad (SDS) før bruk
- Bruk påkrevd verneutstyr (se etikett)
- Arbeid i godt ventilert område
- Hold kjemikalier borte fra mat og drikke

VERNEUTSTYR:
- Vernebriller eller ansiktsskjerm
- Kjemikaliebestandige hansker
- Åndedrettsvern ved nødvendig
- Vernefrakk/forklede

VED SØL:
1. Evakuer området hvis nødvendig
2. Varsle HMS-ansvarlig
3. Bruk riktig absorberingsmateriale
4. Samle opp i merkede beholdere
5. Ventiler området

VED ULYKKE/EKSPONERING:
- Hud: Skyll med mye vann i minst 15 minutter
- Øyne: Skyll i øyedusj i minst 15 minutter
- Innånding: Gå til frisk luft, søk lege
- Svelging: IKKE fremkall brekninger, ring 113',
'critical', 'published', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
'["kjemikalier", "farlig", "verneutstyr", "søl", "eksponering", "sikkerhetsdatablad", "ventilering"]'::jsonb, NOW()),

('30000000-0000-0000-0000-000000000004', 'Verneutstyr - krav og bruk',
'PERSONLIG VERNEUTSTYR (PVU)

GENERELLE KRAV:
Alt personell skal bruke påkrevd verneutstyr i merkede områder.

LAGER:
- Vernesko (obligatorisk)
- Refleksvest (obligatorisk)
- Hjelm ved pallstabling over 2 meter

PRODUKSJON:
- Vernesko (obligatorisk)
- Vernebriller (obligatorisk)
- Hørselvern ved maskiner merket med skilt
- Hansker ved håndtering av råvarer
- Hjelm i merkede soner

VEDLIKEHOLD AV PVU:
- Inspiser utstyr før bruk
- Rapporter skader umiddelbart
- Bytt ut slitt utstyr
- Oppbevar tørt og rent',
'critical', 'published', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001',
'["verneutstyr", "vernesko", "hjelm", "hansker", "hørselvern", "vernebriller", "refleksvest"]'::jsonb, NOW()),

('30000000-0000-0000-0000-000000000005', 'Arbeid i høyden - sikkerhetsprosedyrer',
'ARBEID I HØYDEN

DEFINISJON:
Arbeid i høyden er arbeid over 2 meter der fall kan medføre personskade.

FØR ARBEIDET STARTER:
- Gjennomfør risikovurdering
- Velg riktig utstyr (stige, stillas, lift)
- Sjekk at utstyr er godkjent og i god stand
- Sikre arbeidsområdet mot uvedkommende

BRUK AV STIGE:
- Minst 3 kontaktpunkter alltid
- Stigen skal stå på fast, jevnt underlag
- Ikke strekk deg ut til siden
- Bruk verktøybelte for verktøy

BRUK AV STILLAS:
- Kun sertifiserte personer kan montere
- Sjekk at stillas er godkjent før bruk
- Bruk rekkverk på alle sider
- Ikke overbelast dekker',
'critical', 'published', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
'["høyde", "fall", "stige", "stillas", "lift", "sikring", "fallsikring"]'::jsonb, NOW()),

-- Medium severity
('30000000-0000-0000-0000-000000000006', 'Førstehjelpsutstyr - plassering og bruk',
'FØRSTEHJELPSUTSTYR

PLASSERING AV FØRSTEHJELPSSKAP:
- Hovedlager: Ved kontoret
- Produksjon: Ved inngang sør
- Butikk: Bak kassen
- Administrasjon: I kantinen

INNHOLD I FØRSTEHJELPSSKAP:
- Sterile kompresser
- Bandasjer i ulike størrelser
- Plaster
- Engangshansker
- Øyeskyllevæske
- Saks
- Desinfeksjonsmiddel
- Førstehjelpsveiledning

HJERTESTARTER (AED):
Plassert ved hovedinngangen.
Følg taleinstruksjonene fra enheten.',
'medium', 'published', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
'["førstehjelp", "hjertestarter", "aed", "bandasje", "skade", "kompresser"]'::jsonb, NOW()),

('30000000-0000-0000-0000-000000000007', 'Løfteteknikk og tunge løft',
'RIKTIG LØFTETEKNIKK

VURDERING FØR LØFT:
- Kan løftet unngås? Bruk hjelpemidler!
- Vekt: Maks 25 kg alene, tyngre = 2 personer
- Er veien fri?
- Har du godt fotfeste?

RIKTIG LØFTETEKNIKK:
1. Stå nær gjenstanden
2. Bøy i knærne, IKKE ryggen
3. Få godt grep
4. Hold ryggen rett
5. Bruk beina til å løfte
6. Hold gjenstanden nær kroppen
7. Unngå vridning - flytt føttene

HJELPEMIDLER:
- Trillevogn/tralle
- Gaffeltruck (kun sertifiserte)
- Løftebord
- Be om hjelp!',
'medium', 'published', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
'["løfting", "ergonomi", "rygg", "teknikk", "tunge", "hjelpemiddel"]'::jsonb, NOW()),

-- Low severity
('30000000-0000-0000-0000-000000000008', 'Ergonomi ved skjermarbeid',
'ERGONOMI VED SKJERMARBEID

RIKTIG SITTEPOSISJON:
- Føttene flatt på gulvet eller fotbrett
- Knær i 90 graders vinkel
- Korsryggen støttet av stolrygg
- Albuene i 90 graders vinkel
- Skuldrer avslappet

SKJERMPLASSERING:
- Toppen av skjermen i øyehøyde
- 50-70 cm avstand til skjermen
- Skjermen vinkelrett på vinduer

PAUSER:
- Ta 5 minutters pause hver time
- Se bort fra skjermen
- Tøy nakke og skuldre
- Reis deg og gå noen skritt',
'low', 'published', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001',
'["ergonomi", "skjerm", "kontor", "pauser", "stol", "sitting", "nakke"]'::jsonb, NOW())

ON CONFLICT (id) DO NOTHING;

-- 5. Opprett noen flere instrukser (fortsetter...)
INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords, created_at) VALUES
('30000000-0000-0000-0000-000000000009', 'Rutiner for avviksrapportering', 'HVA ER ET AVVIK?\n- Nestenulykker\n- Arbeidsulykker\n- Farlige situasjoner\n\nHVORDAN RAPPORTERE:\n1. Logg inn på Tetra\n2. Gå til Avvik & Varsler\n3. Fyll ut skjema\n4. Send inn rapport', 'medium', 'published', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '["avvik", "rapportering", "nestenulykke", "varsling"]'::jsonb, NOW()),
('30000000-0000-0000-0000-000000000010', 'Støy - vernekrav og grenseverdier', 'GRENSEVERDIER:\n- 80 dB: Hørselvern tilgjengelig\n- 85 dB: Hørselvern OBLIGATORISK\n- 87 dB: Maksimal tillatt', 'medium', 'published', '20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '["støy", "hørselvern", "desibel", "hørsel", "vern"]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- STOPP HER OG LES:
-- ============================================
-- Nå må du manuelt opprette 2 auth-brukere:
-- ============================================
-- 1. Gå til Supabase Dashboard → Authentication → Users
-- 2. Klikk "Add user" → "Create new user"
-- 3. Opprett disse:
--
--    ADMIN:
--    - Email: admin@demo.no
--    - Password: Demo2024!
--    - Auto Confirm User: JA
--    - Kopier USER ID
--
--    ANSATT:
--    - Email: lars.hansen@demo.no
--    - Password: Demo2024!
--    - Auto Confirm User: JA
--    - Kopier USER ID
--
-- 4. Kjør SQL under og erstatt USER_ID verdiene:
-- ============================================

-- DETTE KJØRER DU ETTER AT AUTH-BRUKERE ER OPPRETTET:
/*
-- Erstatt 'ADMIN_USER_ID_HER' med faktisk ID fra auth.users
INSERT INTO profiles (id, full_name, role, org_id, team_id) VALUES
('ADMIN_USER_ID_HER', 'Admin Demo', 'admin', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004');

-- Erstatt 'LARS_USER_ID_HER' med faktisk ID fra auth.users
INSERT INTO profiles (id, full_name, role, org_id, team_id) VALUES
('LARS_USER_ID_HER', 'Lars Hansen', 'employee', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
*/

-- 6. Opprett noen audit logs (siste 30 dager)
-- KJØR DETTE ETTER AT PROFILES ER OPPRETTET
/*
INSERT INTO audit_logs (org_id, user_id, action_type, entity_type, entity_id, details, created_at)
SELECT
  '00000000-0000-0000-0000-000000000001',
  'ADMIN_USER_ID_HER',
  'publish_instruction',
  'instruction',
  '30000000-0000-0000-0000-000000000001',
  '{"instruction_title": "Demo Instruks"}'::jsonb,
  NOW() - (random() * interval '30 days')
FROM generate_series(1, 20);
*/

-- 7. Opprett lesebekreftelser
-- KJØR DETTE ETTER AT PROFILES ER OPPRETTET
/*
INSERT INTO instruction_reads (instruction_id, user_id, org_id, read_at, confirmed_at, confirmed)
VALUES
('30000000-0000-0000-0000-000000000001', 'LARS_USER_ID_HER', '00000000-0000-0000-0000-000000000001', NOW() - interval '5 days', NOW() - interval '5 days', true),
('30000000-0000-0000-0000-000000000002', 'LARS_USER_ID_HER', '00000000-0000-0000-0000-000000000001', NOW() - interval '3 days', NOW() - interval '3 days', true),
('30000000-0000-0000-0000-000000000003', 'LARS_USER_ID_HER', '00000000-0000-0000-0000-000000000001', NOW() - interval '1 day', NULL, false);
*/

-- ============================================
-- FERDIG! Gå til /demo og logg inn
-- ============================================
