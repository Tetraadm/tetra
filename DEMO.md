# 🚀 Tetra Demo-miljø

Komplett demo-oppsett med realistiske testdata for presentasjoner og testing.

## Hva inneholder demo-miljøet?

### 📊 Data
- **1 organisasjon**: "Demo Bedrift AS"
- **4 teams**: Lager, Produksjon, Butikk, Administrasjon
- **20 brukere**: 5 per team (fordelt realistisk)
- **6 mapper**: Brann, Maskinsikkerhet, Kjemi, Førstehjelp, Verneutstyr, HMS
- **20 instrukser**: Fullstendige norske HMS-instrukser med realistisk innhold
- **50+ audit logs**: Historiske hendelser siste 30 dager
- **Lesebekreftelser**: 60-90% av brukere har bekreftet hver instruks

### 📋 Instrukser (eksempler)
- Brannrutiner og evakueringsplan
- Bruk av gaffeltruck - sikkerhetsrutiner
- Håndtering av farlige kjemikalier
- Førstehjelpsutstyr - plassering og bruk
- Verneutstyr - krav og bruk
- Arbeid i høyden - sikkerhetsprosedyrer
- Rutiner for avviksrapportering
- Ergonomi ved skjermarbeid
- Løfteteknikk og tunge løft
- _...og 11 flere_

## 🎯 Oppsett

### 1. Installer avhengigheter (hvis ikke gjort)
```bash
npm install
npm install -D tsx  # For å kjøre TypeScript-scripts
```

### 2. Kjør seed-script
```bash
npm run seed:demo
```

Dette oppretter:
- Demo organisasjon
- Teams, brukere og mapper
- 20 fullstendige HMS-instrukser med keywords
- Historiske audit logs
- Lesebekreftelser

### 3. Opprett demo-brukere i Supabase Auth

Gå til Supabase Dashboard → Authentication → Users og opprett disse brukerne manuelt:

**Admin:**
- Email: `admin@demo.no`
- Password: `Demo2024!`

**Ansatt:**
- Email: `lars.hansen@demo.no`
- Password: `Demo2024!`

**Viktig:** Husk å kopiere user ID-ene og oppdater `profiles` tabellen med riktige ID-er fra seed-scriptet.

### 4. Åpne demo-siden
Gå til: `http://localhost:3000/demo`

## 👥 Demo-brukere

### Admin-bruker
- **Email**: `admin@demo.no`
- **Passord**: `Demo2024!`
- **Tilgang til**:
  - Alle instrukser (20 stk)
  - Aktivitetslogg (50+ hendelser)
  - Lesebekreftelser (full rapport)
  - Brukerstyring
  - Team-administrasjon

### Ansatt-bruker
- **Email**: `lars.hansen@demo.no`
- **Passord**: `Demo2024!`
- **Team**: Lager
- **Har tilgang til**:
  - Alle publiserte instrukser
  - "Jeg har lest og forstått" bekreftelse
  - AI chat (Spør Tetra)
  - Noen instrukser allerede bekreftet

## 🎭 Demo-scenarioer

### Scenario 1: Admin Dashboard Tour
1. Logg inn som admin (`admin@demo.no`)
2. Se oversikt med statistikk
3. Gå til "Instrukser" tab → Se 20 fullstendige instrukser
4. Gå til "Aktivitetslogg" tab → Filtrer etter handling
5. Gå til "Lesebekreftelser" tab → Utvid en instruks
6. Eksporter CSV for compliance-rapport

### Scenario 2: Employee Experience
1. Logg inn som ansatt (`lars.hansen@demo.no`)
2. Se kritiske instrukser på forsiden
3. Åpne en instruks → Klikk "Jeg har lest og forstått"
4. Gå til "Spør Tetra" → Spør: "Hva gjør jeg ved brann?"
5. Se hvordan AI filtrerer til relevante instrukser

### Scenario 3: Compliance Audit
1. Logg inn som admin
2. Gå til "Lesebekreftelser"
3. Eksporter CSV-rapport
4. Åpne i Excel/Google Sheets
5. Vis detaljert status per ansatt

### Scenario 4: AI Keyword Filtering
1. Logg inn som ansatt
2. Gå til "Spør Tetra"
3. Test ulike spørsmål:
   - "Hvilke verneutstyr trenger jeg?"
   - "Hva gjør jeg ved kjemikaliesøl?"
   - "Hvordan bruker jeg gaffeltruck?"
4. Se hvordan AI filtrerer til topp 10 relevante instrukser

## 🧹 Rydde opp demo-data

Hvis du vil starte på nytt:

```sql
-- ADVARSEL: Dette sletter ALL demo-data!

DELETE FROM instruction_reads WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM audit_logs WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM instructions WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM folders WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM profiles WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM teams WHERE org_id IN (SELECT id FROM organizations WHERE name = 'Demo Bedrift AS');
DELETE FROM organizations WHERE name = 'Demo Bedrift AS';
```

Deretter kjør `npm run seed:demo` på nytt.

## 📸 Screenshots & Presentasjon

### Demonstrer disse funksjonene:

1. **✅ Audit Logging**
   - Vis filtrering etter handlingstype
   - Vis tidslinje siste 30 dager
   - CSV export

2. **✅ Lesebekreftelser**
   - Vis oversikt per instruks
   - Utvid instruks → se detaljert brukerstatus
   - Vis prosentandel bekreftet
   - CSV export for compliance

3. **✅ AI Keyword Filtering**
   - Spør komplekst spørsmål
   - Vis at kun 10 mest relevante instrukser sendes
   - Redusert token-bruk

4. **✅ Employee UI**
   - Mobilvennlig design
   - "Jeg har lest og forstått" knapp
   - Grønn bekreftelse når gjennomført

## 💡 Tips for presentasjon

- Start med ansatt-visning (enklere, mer visuell)
- Bytt til admin-visning for å vise rapportering
- Demonstrer CSV-export for compliance
- Vis audit log for å vise sporbarhet
- Bruk mobilvisning (reduser browser-bredde)

## 🚨 Viktige notater

- Demo-data er **kun for testing/presentasjon**
- Ikke bruk i produksjon
- Auth-brukere må opprettes manuelt i Supabase
- Seed-scriptet kan kjøres flere ganger (men vil duplisere data)

## 📞 Support

Hvis noe ikke fungerer:
1. Sjekk at alle migrasjoner er kjørt
2. Sjekk at `SUPABASE_SERVICE_ROLE_KEY` er satt i `.env.local`
3. Sjekk at demo-brukere er opprettet i Supabase Auth
