-- ============================================================================
-- TETRIVO HMS - PILOT SEED DATA
-- ============================================================================
-- Realistisk testdata for pilottesting av HMS-plattformen.
-- VIKTIG: Bruk kun i dev/test miljø, ikke i produksjon.
-- ============================================================================

-- Bruk eksisterende organisasjon
DO $$
DECLARE
  ORG_ID UUID := '16a76b5d-d293-4d73-a1db-b7eadcc3bf32';
  
  -- Team IDs
  team_lager UUID;
  team_produksjon UUID;
  team_kontor UUID;
  team_vedlikehold UUID;
  
  -- Folder IDs
  folder_sikkerhet UUID;
  folder_brann UUID;
  folder_forstehjelp UUID;
  folder_maskin UUID;
  
  -- Instruction IDs
  inst_brannsikkerhet UUID;
  inst_forstehjelp UUID;
  inst_gaffeltruck UUID;
  inst_verneutstyr UUID;
  inst_kjemikalier UUID;
  inst_ergonomi UUID;
  inst_elektro UUID;
  inst_varmearbeid UUID;
  
BEGIN
  -- ============================================================================
  -- TEAMS (4 teams)
  -- ============================================================================
  INSERT INTO teams (id, name, org_id) VALUES
    (gen_random_uuid(), 'Lager', ORG_ID) RETURNING id INTO team_lager;
  INSERT INTO teams (id, name, org_id) VALUES
    (gen_random_uuid(), 'Produksjon', ORG_ID) RETURNING id INTO team_produksjon;
  INSERT INTO teams (id, name, org_id) VALUES
    (gen_random_uuid(), 'Kontor/Admin', ORG_ID) RETURNING id INTO team_kontor;
  INSERT INTO teams (id, name, org_id) VALUES
    (gen_random_uuid(), 'Vedlikehold', ORG_ID) RETURNING id INTO team_vedlikehold;

  -- ============================================================================
  -- FOLDERS (4 kategorier)
  -- ============================================================================
  INSERT INTO folders (id, name, org_id) VALUES
    (gen_random_uuid(), 'Brannsikkerhet', ORG_ID) RETURNING id INTO folder_brann;
  INSERT INTO folders (id, name, org_id) VALUES
    (gen_random_uuid(), 'Førstehjelp', ORG_ID) RETURNING id INTO folder_forstehjelp;
  INSERT INTO folders (id, name, org_id) VALUES
    (gen_random_uuid(), 'Maskinarbeid', ORG_ID) RETURNING id INTO folder_maskin;
  INSERT INTO folders (id, name, org_id) VALUES
    (gen_random_uuid(), 'Generell sikkerhet', ORG_ID) RETURNING id INTO folder_sikkerhet;

  -- ============================================================================
  -- INSTRUCTIONS (8 HMS-instrukser)
  -- ============================================================================
  
  -- 1. Brannsikkerhet
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Brannslokkingsutstyr og evakuering', 
     E'# Brannsikkerhet\n\n## Brannslukningsapparater\n\nVi har følgende typer brannslukningsapparater:\n\n- **Pulverapparat** (rød): For de fleste branner\n- **CO2-apparat** (svart): For elektriske branner\n- **Skumapparat**: For væskebranner\n\n## Ved brann\n\n1. Varsle andre ved å rope "BRANN!"\n2. Aktiver nærmeste brannalarm\n3. Ring 110\n4. Forsøk å slukke kun hvis det er trygt\n5. Evakuer via nærmeste nødutgang\n6. Møt på oppsamlingsplass (hovedparkeringen)\n\n## Viktig\n\n- Bruk ALDRI heis ved brann\n- Lukk dører bak deg\n- Hjelp kolleger som trenger assistanse\n\n**Brannvernleder:** Ola Hansen (mobil: 900 12 345)',
     'critical', 'published', folder_brann, ORG_ID, 
     '["brann", "evakuering", "brannslokker", "nødutgang", "brannalarm", "110"]'::jsonb)
    RETURNING id INTO inst_brannsikkerhet;

  -- 2. Førstehjelp
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Førstehjelp ved ulykker', 
     E'# Førstehjelp\n\n## Ved ulykke - HUSK: DHLR\n\n### D - Sikre omgivelsene (Danger)\nSjekk at det er trygt for deg og den skadde.\n\n### H - Sjekk bevissthet (Hello)\nRist forsiktig i skuldrene og spør høyt.\n\n### L - Lytt og se (Look/Listen)\nSjekk pust i 10 sekunder.\n\n### R - Ring 113 (Response)\nRing AMK-sentralen og følg instruksjonene.\n\n## Førstehjelpsskap\n\nFørstehjelpsskap finnes:\n- Kantinen (hovedskap)\n- Lageravdelingen\n- Produksjonshallen\n- Kontorbygget 2. etasje\n\n## Hjertestarter (AED)\n\nPlassering:\n- Resepsjonen (inngangspartiet)\n- Produksjonshallen (ved verktøyrom)\n\n**Bedriftshelsetjeneste:** 22 00 00 00',
     'critical', 'published', folder_forstehjelp, ORG_ID,
     '["førstehjelp", "ulykke", "113", "hjertestarter", "AED", "HLR", "skade"]'::jsonb)
    RETURNING id INTO inst_forstehjelp;

  -- 3. Gaffeltruck
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Sikker bruk av gaffeltruck', 
     E'# Gaffeltruckførerbevis\n\n## Krav\n\nAlle som skal kjøre gaffeltruck må ha:\n- Gyldig truckførerbevis (T1, T2, T3 eller T4)\n- Godkjenning fra arbeidsleder\n- Gjennomført intern opplæring\n\n## Daglig kontroll\n\nFør bruk skal du sjekke:\n- Bremser fungerer\n- Styring OK\n- Gafler uten skader\n- Horn og lys virker\n- Dekk og hjul\n- Hydraulikk (ingen lekkasjer)\n\n## Sikker kjøring\n\n- **Alltid bruk setebeltet**\n- Maks hastighet: 10 km/t innendørs\n- Kjør med gafler senket\n- Se i kjøreretningen\n- Ikke kjør med passasjerer\n- Stopp ved fotgjengeroverganger\n\n## Last\n\n- Sjekk alltid kapasitet før løft\n- Stabilt festet last\n- Ikke stable høyere enn synlig\n\n**Truck-ansvarlig:** Per Olsen',
     'high', 'published', folder_maskin, ORG_ID,
     '["gaffeltruck", "truck", "truckførerbevis", "T1", "T2", "lastbærer", "løft"]'::jsonb)
    RETURNING id INTO inst_gaffeltruck;

  -- 4. Verneutstyr (PPE)
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Personlig verneutstyr (PPE)', 
     E'# Personlig verneutstyr\n\n## Påbudt i produksjon og lager\n\n| Utstyr | Når |\n|--------|-----|\n| Vernesko | Alltid |\n| Hjelm | Ved risiko for fallende gjenstander |\n| Vernebriller | Ved sliping, skjæring, kjemikalier |\n| Hørselvern | Støynivå over 85 dB |\n| Hansker | Håndtering av skarpe/varme gjenstander |\n\n## Soner\n\n### Rød sone (Produksjon)\n- Vernesko påbudt\n- Hjelm påbudt\n- Hørselvern tilgjengelig\n\n### Gul sone (Lager)\n- Vernesko påbudt\n- Refleksvest anbefalt\n\n### Grønn sone (Kontor)\n- Ingen spesielle krav\n\n## Vedlikehold\n\nSkadde eller slitt verneutstyr skal byttes umiddelbart. Meld fra til din leder.\n\n**HMS-ansvarlig:** Kari Nordmann',
     'medium', 'published', folder_sikkerhet, ORG_ID,
     '["verneutstyr", "PPE", "vernesko", "hjelm", "vernebriller", "hørselvern", "hansker"]'::jsonb)
    RETURNING id INTO inst_verneutstyr;

  -- 5. Kjemikalier
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Håndtering av kjemikalier', 
     E'# Kjemikaliehåndtering\n\n## Sikkerhetsdatablad (SDS)\n\nAlle kjemikalier skal ha tilgjengelig sikkerhetsdatablad. Disse finnes:\n- I permen ved kjemikalieskap\n- Digitalt i EcoOnline-systemet\n\n## Merking\n\nLær deg faresymbolene:\n- ⚠️ Etsende\n- ☠️ Giftig\n- 🔥 Brannfarlig\n- 💥 Eksplosiv\n\n## Håndtering\n\n1. Les alltid sikkerhetsdatabladet først\n2. Bruk påbudt verneutstyr\n3. Jobb i ventilert område\n4. Aldri bland kjemikalier\n5. Lukk beholdere etter bruk\n\n## Søl\n\nVed søl:\n1. Varsle kolleger\n2. Bruk absorberingsmiddel fra spill-kit\n3. Bruk verneutstyr\n4. Kontakt HMS-ansvarlig\n\n**Kjemikalieoversikt:** EcoOnline\n**Nødnummer:** Giftinformasjonen 22 59 13 00',
     'high', 'published', folder_sikkerhet, ORG_ID,
     '["kjemikalier", "SDS", "sikkerhetsdatablad", "etsende", "giftig", "søl", "EcoOnline"]'::jsonb)
    RETURNING id INTO inst_kjemikalier;

  -- 6. Ergonomi
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Ergonomi ved kontorarbeid', 
     E'# Ergonomi på kontoret\n\n## Skjermarbeid\n\n### Riktig sittestilling\n- Føttene flatt i gulvet\n- Knær i 90 graders vinkel\n- Rygg støttet av stolryggen\n- Skuldre avslappet\n- Øyne i høyde med skjermtopp\n\n### Skjermplassering\n- Avstand: 50-70 cm fra øynene\n- Skjerm rett foran deg\n- Unngå gjenskinn fra vinduer\n\n## Pauser\n\n- Ta mikropause hvert 20-30 minutt\n- Strekk nakke, skuldre og rygg\n- Se bort fra skjermen (20-20-20 regelen)\n\n## Hev-senk-pult\n\nVeksle mellom sittende og stående arbeid:\n- Start med 30 min stående\n- Øk gradvis til 2-4 timer per dag\n- Bruk antitretthetsmatte\n\n## Ergonomisk vurdering\n\nBestill time for ergonomisk vurdering via HR-avdelingen.\n\n**Bedriftsfysioterapeut:** Tilgjengelig tirsdager',
     'low', 'published', folder_sikkerhet, ORG_ID,
     '["ergonomi", "kontor", "sittestilling", "skjermarbeid", "hev-senk", "rygg", "nakke"]'::jsonb)
    RETURNING id INTO inst_ergonomi;

  -- 7. Elektrisk arbeid
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Elektrisk sikkerhet', 
     E'# Elektrisk sikkerhet\n\n## Kun kvalifisert personell\n\nAlt elektrisk arbeid skal utføres av:\n- Autorisert elektriker\n- Godkjent installasjonsbedrift\n\n## Generelle regler\n\n### Aldri\n- Arbeid på strømførende anlegg\n- Fjern deksel på elektriske skap\n- Reparer selv på elektrisk utstyr\n- Bruk skadet utstyr eller kabler\n\n### Alltid\n- Meld fra om skader umiddelbart\n- Bruk kun godkjente skjøteledninger\n- Unngå overbelastning av stikkontakter\n\n## Vedlikehold\n\nElektriske installasjoner kontrolleres årlig av godkjent kontrollør.\n\n## Ved strømbrudd\n\n1. Forbli rolig\n2. Nødlys aktiveres automatisk\n3. Følg evakueringsrutiner om nødvendig\n4. Vent på beskjed fra driftsleder\n\n**Driftsansvarlig:** Erik Larsen (mobil: 922 33 456)',
     'critical', 'published', folder_sikkerhet, ORG_ID,
     '["elektrisitet", "strøm", "elektriker", "sikring", "strømbrudd", "el-sikkerhet"]'::jsonb)
    RETURNING id INTO inst_elektro;

  -- 8. Varmearbeid (draft for testing)
  INSERT INTO instructions (id, title, content, severity, status, folder_id, org_id, keywords) VALUES
    (gen_random_uuid(), 'Varmearbeid - sveising og skjæring', 
     E'# Varmearbeid\n\n## Dette er et utkast\n\nDenne instruksen er under utarbeidelse.\n\n## Planlagt innhold\n\n- Sertifisering krav\n- Sikkerhetstiltak\n- Brannsikring\n- Verneutstyr\n- Kontrollrutiner\n\nPubliseres snart.',
     'high', 'draft', folder_maskin, ORG_ID,
     '["sveising", "skjæring", "varmearbeid", "flamme"]'::jsonb)
    RETURNING id INTO inst_varmearbeid;

  -- ============================================================================
  -- INSTRUCTION-TEAM MAPPINGS
  -- ============================================================================
  
  -- Brannsikkerhet: Alle teams
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_brannsikkerhet, team_lager),
    (inst_brannsikkerhet, team_produksjon),
    (inst_brannsikkerhet, team_kontor),
    (inst_brannsikkerhet, team_vedlikehold);
  
  -- Førstehjelp: Alle teams
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_forstehjelp, team_lager),
    (inst_forstehjelp, team_produksjon),
    (inst_forstehjelp, team_kontor),
    (inst_forstehjelp, team_vedlikehold);
  
  -- Gaffeltruck: Lager og Produksjon
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_gaffeltruck, team_lager),
    (inst_gaffeltruck, team_produksjon);
  
  -- Verneutstyr: Lager, Produksjon, Vedlikehold
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_verneutstyr, team_lager),
    (inst_verneutstyr, team_produksjon),
    (inst_verneutstyr, team_vedlikehold);
  
  -- Kjemikalier: Produksjon og Vedlikehold
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_kjemikalier, team_produksjon),
    (inst_kjemikalier, team_vedlikehold);
  
  -- Ergonomi: Kontor
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_ergonomi, team_kontor);
  
  -- Elektrisk: Vedlikehold
  INSERT INTO instruction_teams (instruction_id, team_id) VALUES
    (inst_elektro, team_vedlikehold);

  -- ============================================================================
  -- ALERTS (3 aktive varsler)
  -- ============================================================================
  
  INSERT INTO alerts (title, description, severity, active, org_id) VALUES
    ('Viktig: Oppdatert branninstruks', 
     'Branninstruksen er oppdatert med ny evakueringsplan. Alle ansatte må lese og bekrefte innen fredag.',
     'critical', TRUE, ORG_ID),
    ('HMS-uke 8.-12. april', 
     'Påminnelse om HMS-uken. Alle avdelinger skal gjennomføre vernerunde. Se intranett for påmelding til kurs.',
     'medium', TRUE, ORG_ID),
    ('Nytt førstehjelpsskap på lager', 
     'Det er montert nytt førstehjelpsskap ved inngang B på lageret. Merk deg plasseringen.',
     'low', TRUE, ORG_ID);

  -- ============================================================================
  -- ASK TETRA LOGS (eksempel AI-spørsmål)
  -- ============================================================================
  
  INSERT INTO ask_tetra_logs (org_id, question, answer, source_instruction_id) VALUES
    (ORG_ID, 'Hvor finner jeg brannslokker?', 
     'Brannslokkere finnes ved alle nødutganger og i hver avdeling. Se etter rød skiltmerking. Vi har pulverapparat (rød), CO2-apparat (svart) og skumapparat tilgjengelig.',
     inst_brannsikkerhet),
    (ORG_ID, 'Må jeg ha truckførerbevis?', 
     'Ja, alle som skal kjøre gaffeltruck må ha gyldig truckførerbevis (T1, T2, T3 eller T4), godkjenning fra arbeidsleder, og gjennomført intern opplæring.',
     inst_gaffeltruck),
    (ORG_ID, 'Hva gjør jeg ved søl av kjemikalier?', 
     'Ved kjemikaliesøl: 1) Varsle kolleger, 2) Bruk absorberingsmiddel fra spill-kit, 3) Bruk verneutstyr, 4) Kontakt HMS-ansvarlig. Les alltid sikkerhetsdatabladet.',
     inst_kjemikalier),
    (ORG_ID, 'Hvordan ringer jeg ambulanse?', 
     'Ring 113 for ambulanse (AMK-sentralen). Følg DHLR-prinsippet: Sjekk fare, bevissthet, pust, og ring deretter 113. Hjertestarter finnes i resepsjonen og produksjonshallen.',
     inst_forstehjelp);

  -- ============================================================================
  -- AUDIT LOGS (eksempel aktivitet)
  -- ============================================================================
  
  INSERT INTO audit_logs (org_id, action_type, entity_type, details) VALUES
    (ORG_ID, 'instruction.publish', 'instruction', '{"title": "Brannslokkingsutstyr og evakuering"}'::jsonb),
    (ORG_ID, 'instruction.publish', 'instruction', '{"title": "Førstehjelp ved ulykker"}'::jsonb),
    (ORG_ID, 'team.create', 'team', '{"name": "Lager"}'::jsonb),
    (ORG_ID, 'team.create', 'team', '{"name": "Produksjon"}'::jsonb),
    (ORG_ID, 'alert.create', 'alert', '{"title": "Viktig: Oppdatert branninstruks"}'::jsonb);

  RAISE NOTICE 'Pilot seed data created successfully!';
  RAISE NOTICE 'Teams: 4, Folders: 4, Instructions: 8, Alerts: 3';
  
END $$;
