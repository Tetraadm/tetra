/**
 * Demo Seed Script for Tetra
 *
 * Populerer databasen med realistiske testdata for demo-formål:
 * - 1 demo organisasjon
 * - 4 teams
 * - 20 brukere
 * - 6 mapper
 * - 20 HMS-instrukser (mix tekst og PDF)
 * - Historiske audit logs
 * - Lesebekreftelser
 * - AI chat-logg
 */

import { createClient } from '@supabase/supabase-js'
import { extractKeywords } from '../src/lib/keyword-extraction'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Demo organisasjon
const DEMO_ORG = {
  name: 'Demo Bedrift AS',
  industry: 'Produksjon og Lager'
}

// Demo teams
const DEMO_TEAMS = [
  'Lager',
  'Produksjon',
  'Butikk',
  'Administrasjon'
]

// Demo brukere (5 per team)
const DEMO_USERS = [
  // Lager team
  { name: 'Lars Hansen', email: 'lars.hansen@demo.no', role: 'employee', team: 'Lager' },
  { name: 'Kari Olsen', email: 'kari.olsen@demo.no', role: 'employee', team: 'Lager' },
  { name: 'Per Andersen', email: 'per.andersen@demo.no', role: 'employee', team: 'Lager' },
  { name: 'Nina Berg', email: 'nina.berg@demo.no', role: 'employee', team: 'Lager' },
  { name: 'Erik Sørensen', email: 'erik.sorensen@demo.no', role: 'employee', team: 'Lager' },

  // Produksjon team
  { name: 'Morten Johansen', email: 'morten.johansen@demo.no', role: 'employee', team: 'Produksjon' },
  { name: 'Linda Eriksen', email: 'linda.eriksen@demo.no', role: 'employee', team: 'Produksjon' },
  { name: 'Thomas Pettersen', email: 'thomas.pettersen@demo.no', role: 'employee', team: 'Produksjon' },
  { name: 'Anne Kristensen', email: 'anne.kristensen@demo.no', role: 'employee', team: 'Produksjon' },
  { name: 'Jan Nilsen', email: 'jan.nilsen@demo.no', role: 'employee', team: 'Produksjon' },

  // Butikk team
  { name: 'Maria Larsen', email: 'maria.larsen@demo.no', role: 'employee', team: 'Butikk' },
  { name: 'Anders Christiansen', email: 'anders.christiansen@demo.no', role: 'employee', team: 'Butikk' },
  { name: 'Hanne Jensen', email: 'hanne.jensen@demo.no', role: 'employee', team: 'Butikk' },
  { name: 'Odd Pedersen', email: 'odd.pedersen@demo.no', role: 'employee', team: 'Butikk' },
  { name: 'Silje Haugen', email: 'silje.haugen@demo.no', role: 'employee', team: 'Butikk' },

  // Admin team
  { name: 'Admin Demo', email: 'admin@demo.no', role: 'admin', team: 'Administrasjon' },
  { name: 'Leder Demo', email: 'leder@demo.no', role: 'employee', team: 'Administrasjon' },
  { name: 'HMS Ansvarlig', email: 'hms@demo.no', role: 'employee', team: 'Administrasjon' },
  { name: 'Økonomi Ansatt', email: 'okonomi@demo.no', role: 'employee', team: 'Administrasjon' },
  { name: 'HR Ansatt', email: 'hr@demo.no', role: 'employee', team: 'Administrasjon' }
]

// Demo mapper
const DEMO_FOLDERS = [
  'Brann og Evakuering',
  'Maskinsikkerhet',
  'Kjemisk Håndtering',
  'Førstehjelpsutstyr',
  'Personlig Verneutstyr',
  'Generelle HMS-rutiner'
]

// Demo instrukser (20 stk)
const DEMO_INSTRUCTIONS = [
  {
    title: 'Brannrutiner og evakueringsplan',
    folder: 'Brann og Evakuering',
    severity: 'critical',
    content: `BRANNRUTINER

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

Kontroller at du vet hvor nærmeste brannslukkingsutstyr er plassert.`
  },
  {
    title: 'Bruk av gaffeltruck - sikkerhetsrutiner',
    folder: 'Maskinsikkerhet',
    severity: 'critical',
    content: `SIKKERHETSRUTINER FOR GAFFELTRUCK

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

KUN SERTIFISERTE OPERATØRER MAY OPERATE TRUCKEN`
  },
  {
    title: 'Håndtering av farlige kjemikalier',
    folder: 'Kjemisk Håndtering',
    severity: 'critical',
    content: `RUTINER FOR HÅNDTERING AV FARLIGE KJEMIKALIER

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
- Svelging: IKKE fremkall brekninger, ring 113

LAGRING:
- Oppbevar i original emballasje
- Merk alle beholdere tydelig
- Separer uforenlige kjemikalier
- Lås inn i godkjent skap`
  },
  {
    title: 'Førstehjelpsutstyr - plassering og bruk',
    folder: 'Førstehjelpsutstyr',
    severity: 'medium',
    content: `FØRSTEHJELPSUTSTYR

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
Følg taleinstruksjonene fra enheten.

FØRSTEHJELPSANSVARLIGE:
- Linda Eriksen (Produksjon)
- Hanne Jensen (Butikk)
- HMS Ansvarlig (Administrasjon)

VED ALVORLIG SKADE:
Ring 113 umiddelbart`
  },
  {
    title: 'Verneutstyr - krav og bruk',
    folder: 'Personlig Verneutstyr',
    severity: 'critical',
    content: `PERSONLIG VERNEUTSTYR (PVU)

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

BUTIKK:
- Sklisikre sko anbefales
- Hansker ved varemottak

VEDLIKEHOLD AV PVU:
- Inspiser utstyr før bruk
- Rapporter skader umiddelbart
- Bytt ut slitt utstyr
- Oppbevar tørt og rent

UTLEVERING:
Kontakt leder for utlevering av verneutstyr.
Alt utstyr er gratis for ansatte.`
  },
  {
    title: 'Arbeid i høyden - sikkerhetsprosedyrer',
    folder: 'Generelle HMS-rutiner',
    severity: 'critical',
    content: `ARBEID I HØYDEN

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
- Ikke overbelast dekker

BRUK AV LIFT/SAKSELIFT:
- Kun autorisert personell
- Bruk falldempende sele
- Sikre området under liften
- Følg produsents instruksjoner

VÆRFORHOLD:
Ikke arbeid i høyden ved sterk vind eller glatt underlag`
  },
  {
    title: 'Rutiner for avviksrapportering',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `AVVIKSRAPPORTERING

HVA ER ET AVVIK?
- Nestenulykker
- Arbeidsulykker
- Farlige situasjoner
- Skader på utstyr
- HMS-brudd

HVORDAN RAPPORTERE:
1. Logg inn på Tetra
2. Gå til "Avvik & Varsler"
3. Fyll ut skjema med:
   - Beskrivelse av hendelsen
   - Tidspunkt og sted
   - Eventuelle skader
   - Forslag til tiltak
4. Send inn rapport

ALLE AVVIK SKAL RAPPORTERES - uansett hvor små!

BEHANDLING:
- HMS-ansvarlig vurderer rapporten innen 48 timer
- Tiltak iverksettes om nødvendig
- Du får tilbakemelding

KONFIDENSIALITET:
Rapporter behandles konfidensielt.
Du kan rapportere anonymt hvis ønskelig.`
  },
  {
    title: 'Ergonomi ved skjermarbeid',
    folder: 'Generelle HMS-rutiner',
    severity: 'low',
    content: `ERGONOMI VED SKJERMARBEID

RIKTIG SITTEPOSISJON:
- Føttene flatt på gulvet eller fotbrett
- Knær i 90 graders vinkel
- Korsryggen støttet av stolrygg
- Albuene i 90 graders vinkel
- Skuldrer avslappet

SKJERMPLASSERING:
- Toppen av skjermen i øyehøyde
- 50-70 cm avstand til skjermen
- Skjermen vinkelrett på vinduer (unngå reflekser)
- Ren skjerm

TASTATUR OG MUS:
- Rett foran deg
- Nær kroppen
- Håndledd rett (ikke bøyd)

PAUSER:
- Ta 5 minutters pause hver time
- Se bort fra skjermen (fokuser på langt punkt)
- Tøy nakke og skuldre
- Reis deg og gå noen skritt

BELYSNING:
- Kombinasjon av direkte og indirekte lys
- Unngå kraftig sollys
- Juster skjermens lysstyrke

Kontakt leder hvis du opplever plager.`
  },
  {
    title: 'Løfteteknikk og tunge løft',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `RIKTIG LØFTETEKNIKK

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

VARSELSIGNALER (STOPP UMIDDELBART):
- Smerte i rygg
- Følelse av å miste grepet
- Ustabilt underlag

HJELPEMIDLER:
- Trillevogn/tralle
- Gaffeltruck (kun sertifiserte)
- Løftebord
- Be om hjelp!

REPETERENDE LØFT:
Ta pauser for hver 20 løft.
Variasjoner i arbeidsoppgaver reduserer belastning.

VED RYGGPLAGER:
Kontakt leder - det kan ordnes lettere oppgaver.`
  },
  {
    title: 'Elbil og ladestasjon - sikkerhet',
    folder: 'Generelle HMS-rutiner',
    severity: 'low',
    content: `ELBIL OG LADESTASJON

GENERELL SIKKERHET:
- Høyspenning - ikke åpne deksler
- Ikke lad ved synlige skader på kabel
- Hold barn unna under lading
- Ikke lad ved tordenvær

LADING:
1. Skru av bilen
2. Åpne ladedøren på bilen
3. Ta ut ladekabel
4. Koble til bilen
5. Start lading (følg instrukser på lader)

ETTER LADING:
1. Stopp lading på skjerm
2. Koble fra bilen
3. Sett ladekabel tilbake på plass
4. Lukk ladedør

VED FEIL/SKADE:
- Ikke bruk ødelagt lader
- Rapporter feil til HMS-ansvarlig
- Bruk alternativ ladestasjon

PARKERING:
Kun bruk ladeplasser under lading (maks 4 timer).
Flytt bilen når lading er ferdig.`
  },
  {
    title: 'Støy - vernekrav og grenseverdier',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `STØYVERN

GRENSEVERDIER:
- 80 dB: Hørselvern skal være tilgjengelig
- 85 dB: Hørselvern er OBLIGATORISK
- 87 dB: Maksimal tillatt eksponering

OMRÅDER MED HØRSELVERN-KRAV:
- Produksjonshall (maskin A, B, C)
- Kompressorrom
- Pakkeområde ved transportbånd
- Se skilt ved inngang

TYPER HØRSELVERN:
- Ørepropper: Gir 25-30 dB demping
- Hørselskåper: Gir 30-35 dB demping
- Tilpassede ørepropper: Kontakt HMS-ansvarlig

RIKTIG BRUK:
- Sett inn/på FØR du går inn i støyområde
- Sjekk at det sitter tett
- Bytt ørepropper daglig (engangs)
- Rengjør hørselskåper ukentlig

HELSEEFFEKTER VED STØY:
- Hørselsskader (permanent)
- Tinnitus (øresus)
- Stress og konsentrasjonsproblemer

RAPPORTER:
Rapporter hvis du opplever øresus eller dårligere hørsel.`
  },
  {
    title: 'Varmt arbeid - sveising og termiske arbeider',
    folder: 'Maskinsikkerhet',
    severity: 'critical',
    content: `VARMT ARBEID

DEFINISJON:
Arbeid med åpen flamme, sveising, termisk kutting, sliping som gir gnister.

TILLATELSE:
Varmt arbeid krever ALLTID skriftlig tillatelse fra leder.

FØR ARBEIDET:
1. Søk om tillatelse (24t før)
2. Fjern brennbart materiale (10 meter radius)
3. Dekk til det som ikke kan flyttes
4. Ha brannslukkingsutstyr klart
5. Varsle vaktselskap hvis brannalarm må kobles ut

BRANNVAKT:
- Under arbeidet: Kontinuerlig oppsyn
- Etter arbeidet: Brannvakt i minimum 1 time

VERNEUTSTYR:
- Sveisehjelm med riktig filter
- Lærfrakk/sveiseforklede
- Sveisehansker
- Vernesko
- Åndedrettsvern ved behov

VED BRANN:
1. Slå brannalarm
2. Evakuer
3. Bekjemp hvis trygt
4. Ring 110

OPPBEVARING:
Sveiseutstyr oppbevares i eget skap i verksted.
Gassflasker skal være festet og skilt.`
  },
  {
    title: 'Kuldekjede - håndtering av kjølevarer',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `KULDEKJEDE - HÅNDTERING AV KJØLEVARER

TEMPERATURKRAV:
- Fryste varer: -18°C eller lavere
- Kjølte varer: 0-4°C
- Tørrvarer: Romtemperatur

MOTTAK:
1. Sjekk temperatur ved levering
2. Avvis varer med høy temperatur
3. Registrer avvik i logg
4. Flytt til kjøl/frys innen 15 minutter

LAGRING:
- FIFO-prinsipp (først inn, først ut)
- Ikke overfyll kjølerom (blokkerer luftsirkulasjon)
- Hold dører lukket
- Åpne dør maks 2 minutter

TEMPERATURKONTROLL:
- Sjekk og logg temperatur 2 ganger daglig
- Rapporter avvik umiddelbart
- Alarmer skal testes ukentlig

VED STRØMBRUDD/AVVIK:
1. Hold dører lukket
2. Varsle leder
3. Mål temperatur hver 30. min
4. Vurder kassering hvis temperatur over 7°C i >2 timer

HYGIENE:
- Vask hender før håndtering
- Bruk hansker ved direktekontakt
- Rengjør kjølerom ukentlig`
  },
  {
    title: 'Trafikksikkerhet på arbeidsområdet',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `TRAFIKKSIKKERHET PÅ ARBEIDSOMRÅDET

GANGAREAL:
- Bruk merkede gangveier
- Kryss kjørearealer på merkede steder
- Se deg for før du krysser
- Mobilbruk forbudt ved kryssing

ARBEID VED KJØREAREAL:
- Bruk refleksvest (obligatorisk)
- Sett opp varselskilter
- Sikre området med kjegler/sperrebånd
- Kommuniser med sjåfører

TRUCKKJØRING:
- Trucken har alltid forkjørsrett
- Gå ALDRI bak reverserende truck
- Hold avstand (minimum 2 meter)
- Øyekontakt med fører før kryssing

VARELEVERING:
- Kun autorisert personell i lasterampe
- Bruk refleksvest
- Kommuniser med sjåfør
- Stå aldri mellom truck og lastebil

VINTERDRIFT:
- Ekstra aktsomhet ved is og snø
- Bruk brodder ved glatt føre
- Reduser hastighet
- Økt bremseavstand

RAPPORTER FARLIGE SITUASJONER!`
  },
  {
    title: 'Psykososialt arbeidsmiljø',
    folder: 'Generelle HMS-rutiner',
    severity: 'low',
    content: `PSYKOSOSIALT ARBEIDSMILJØ

HVA ER GODT PSYKOSOSIALT MILJØ?
- Respekt og inkludering
- Tydelig rollefordeling
- Håndterbar arbeidsmengde
- Medvirkning og innflytelse
- Null mobbing og trakassering

FOREBYGGING:
- Jevnlige teammøter
- Åpen kommunikasjon
- Tilbakemeldingskultur
- Sosiale aktiviteter

VED KONFLIKTER:
1. Snakk med personen det gjelder (hvis trygt)
2. Kontakt nærmeste leder
3. Kontakt tillitsvalgt
4. Kontakt bedriftshelsetjenesten

MOBBING/TRAKASSERING:
Vi har nulltoleranse.
Rapporter til leder eller HR - konfidensielt.

STRESS/BELASTNING:
Varsler hvis du opplever:
- Vedvarende høy arbeidsbelastning
- Søvnproblemer
- Angstsymptomer
- Nedsatt arbeidsglede

STØTTERESSURSER:
- Leder
- HR
- Tillitsvalgt
- Bedriftshelsetjeneste
- Bedriftens psykolog (gratis samtaler)`
  },
  {
    title: 'Renhold og hygiene på arbeidsplassen',
    folder: 'Generelle HMS-rutiner',
    severity: 'low',
    content: `RENHOLD OG HYGIENE

DAGLIG RENHOLD:
- Rydd arbeidsplassen ved slutt på vakt
- Kast søppel i riktig beholder
- Tørk opp søl umiddelbart
- Oppbevar verktøy på plass

KJØKKEN/KANTINEOMRÅDE:
- Vask eget servise
- Tørk av bord etter bruk
- Tøm kaffetrakteren
- Oppbevar mat i kjøleskap (merk med navn og dato)
- Kast utgått mat

TOALETTER:
- Rengjøres daglig av renholdspersonale
- Rapporter skader/mangler
- Vask hender etter toalettbesøk
- Bruk hånddesinfeksjon ved behov

AVFALLSHÅNDTERING:
- Restavfall: Svart container
- Papir/papp: Blå container
- Plast: Grønn container
- Metall: Gul container
- Farlig avfall: Eget rom (kontakt leder)

HYGIENEKRAV:
- Vask hender før mat
- Dekk til sår med plaster
- Bli hjemme ved sykdom
- Host i albuekroken

ARBEIDSKLÆR:
Skal vaskes ukentlig (minimum).
Skitne arbeidsklær kan gi hudproblemer.`
  },
  {
    title: 'Glassbrudd - håndtering og opprydding',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `GLASSBRUDD

VED GLASSBRUDD:
1. Sikre området - sett opp varsling
2. Ikke rør glass med bare hender
3. Bruk verktøy og verneutstyr

UTSTYR:
- Tykkle hansker (skader-sikre)
- Feier og skrukke
- Våt mopp
- Glasscontainer

OPPRYDDING:
1. Ta på hansker
2. Plukk opp store biter forsiktig
3. Fei opp små biter
4. Gå over området med våt mopp (fanger opp små fragmenter)
5. Tøm i glasscontainer (IKKE vanlig søppel)

STORE GLASSPARTIER:
Ved knuste vinduer eller glassdører:
- Sikre området helt
- Varsle leder
- Tilkall fagfolk for opprydding
- Bruk alternativ inngang/utgang

VED KUTT:
1. Skyll såret med vann
2. Stopp blødning med trykkbandasje
3. Søk førstehjelper
4. Dype sår eller mye blødning: Ring 113

FOREBYGGING:
- Ikke sett glass nær kanter
- Rapporter sprekker i glass
- Bruk glassmerkinger i øyehøyde`
  },
  {
    title: 'Trappesikkerhet',
    folder: 'Generelle HMS-rutiner',
    severity: 'low',
    content: `TRAPPESIKKERHET

GENERELLE REGLER:
- Bruk rekkverk
- Gå i rolig tempo
- Ikke løp i trapper
- Ett trinn om gangen
- Ikke bruk mobil i trapper

MED BÆRELASS:
- Må kunne se trinnene
- Bruk rekkverk med en hånd
- Tunge lass: Bruk heis eller be om hjelp

VEDLIKEHOLD:
Rapporter umiddelbart:
- Løse trin
- Slitte/glatte trinn
- Defekt belysning
- Ødelagt rekkverk

VINTERDRIFT:
- Ekstra aktsomhet ved is/snø
- Hold deg i rekkverket
- Bruk brodder ved glatt føre
- Rapporter glatte forhold

MOBILBRUK:
Mobilbruk i trapper er forbbudt.
Stopp på reposområde for å sjekke mobil.

BARN:
Barn skal alltid holdes i hånden i trapper.

SIKKERHETSMERKING:
Trinn skal ha gul markering ved kant.
Rapporter hvis markering mangler.`
  },
  {
    title: 'Personvern og GDPR',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `PERSONVERN OG GDPR

BEHANDLING AV PERSONOPPLYSNINGER:
- Kun samle inn nødvendig informasjon
- Kun bruk til formålet det er samlet inn for
- Ikke del med uvedkommende
- Slett når ikke lenger nødvendig

SENSITIV INFORMASJON:
- Helseopplysninger
- Personnummer
- Bankinformasjon

Må alltid behandles konfidensielt og lagres sikkert.

KUNDEDATA:
- Ikke noter kundeinformasjon privat
- Ikke diskuter kunder på offentlig sted
- Lås skjerm når du går fra PC
- Ikke ta med kundelister hjem

E-POST:
- Vær obs på mottakere (ikke "svar alle" uten grunn)
- Krypter sensitiv informasjon
- Ikke send personopplysninger til private e-poster

BRUDD PÅ DATASIKKERHET:
Ved mistanke om brudd (tapt PC, hacket konto):
1. Varsle IT-ansvarlig UMIDDELBART
2. Varsle leder
3. Dokumenter hendelsen

SANKSJONER:
Brudd på personvern kan gi:
- Oppsigelse
- Bøter
- Straff`
  },
  {
    title: 'Strømbrudd - beredskap og prosedyrer',
    folder: 'Generelle HMS-rutiner',
    severity: 'medium',
    content: `STRØMBRUDD - BEREDSKAP

VED STRØMBRUDD:
1. Behold roen
2. Bli på stedet (ikke gå i mørke)
3. Nødlys aktiveres automatisk (3-5 sekunder)
4. Vent på beskjed fra leder

PRODUKSJON:
- Alle maskiner stopper automatisk
- IKKE forsøk å starte maskiner
- Sikre materialer som kan ødelegges
- Vent til strøm er tilbake og maskinene er resatt

LAGER:
- IKKE bruk truck uten lys
- Bruk lommelykt (finnes ved utgang)
- Sikre åpne dører og porter

KJØLEVARER:
- Hold kjøledører STENGT
- Logg temperatur hver 30. min
- Varsle leder hvis >30 min strømbrudd

EVAKUERING:
Hvis strømbruddet varer >10 minutter:
- Følg leders instruksjoner
- Bruk nødutganger (nødlys)
- Samles på oppsamlingsplass

GENERATORER:
Nødgenerator starter automatisk ved lengre brudd.
Prioriterer kjøleanlegg og nødlys.

KOMMUNIKASJON:
Bruk mobiltelefon.
Leder informerer via SMS.`
  }
]

async function main() {
  console.log('🌱 Starting demo seed...\n')

  try {
    // 1. Create demo organization
    console.log('📦 Creating demo organization...')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: DEMO_ORG.name })
      .select()
      .single()

    if (orgError) throw orgError
    console.log(`✅ Organization created: ${org.id}\n`)

    // 2. Create teams
    console.log('👥 Creating teams...')
    const teamIds: Record<string, string> = {}

    for (const teamName of DEMO_TEAMS) {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name: teamName, org_id: org.id })
        .select()
        .single()

      if (error) throw error
      teamIds[teamName] = team.id
      console.log(`  ✓ ${teamName}`)
    }
    console.log()

    // 3. Create folders
    console.log('📁 Creating folders...')
    const folderIds: Record<string, string> = {}

    for (const folderName of DEMO_FOLDERS) {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert({ name: folderName, org_id: org.id })
        .select()
        .single()

      if (error) throw error
      folderIds[folderName] = folder.id
      console.log(`  ✓ ${folderName}`)
    }
    console.log()

    // 4. Create instructions
    console.log('📋 Creating instructions...')
    const instructionIds: string[] = []

    for (const inst of DEMO_INSTRUCTIONS) {
      const keywords = extractKeywords(`${inst.title} ${inst.content}`, 10)

      const { data: instruction, error } = await supabase
        .from('instructions')
        .insert({
          title: inst.title,
          content: inst.content,
          severity: inst.severity,
          status: 'published',
          folder_id: folderIds[inst.folder],
          org_id: org.id,
          keywords: keywords
        })
        .select()
        .single()

      if (error) throw error
      instructionIds.push(instruction.id)
      console.log(`  ✓ ${inst.title}`)
    }
    console.log()

    // 5. Create users (we'll create auth users manually, just profiles here)
    console.log('👤 Creating user profiles...')
    const userIds: string[] = []

    for (const user of DEMO_USERS) {
      // In real scenario, you'd create auth.users first
      // For demo, we'll just create profiles with fake UUIDs
      const fakeUserId = crypto.randomUUID()

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
          id: fakeUserId,
          full_name: user.name,
          email: user.email,
          role: user.role,
          org_id: org.id,
          team_id: teamIds[user.team]
        })
        .select()
        .single()

      if (error) throw error
      userIds.push(profile.id)
      console.log(`  ✓ ${user.name} (${user.role})`)
    }
    console.log()

    // 6. Create historical audit logs
    console.log('📝 Creating audit logs...')
    const auditLogs = []
    const now = new Date()

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const randomUser = userIds[Math.floor(Math.random() * userIds.length)]
      const randomInstruction = instructionIds[Math.floor(Math.random() * instructionIds.length)]

      const actions: Array<{type: string, entity: string, details: any}> = [
        { type: 'publish_instruction', entity: 'instruction', details: { instruction_title: 'Demo Instruks' }},
        { type: 'unpublish_instruction', entity: 'instruction', details: { instruction_title: 'Demo Instruks' }},
        { type: 'delete_instruction', entity: 'instruction', details: { instruction_title: 'Gammel Instruks' }},
        { type: 'change_role', entity: 'user', details: { user_name: 'Demo Bruker', previous_role: 'employee', new_role: 'admin' }}
      ]

      const action = actions[Math.floor(Math.random() * actions.length)]

      const timestamp = new Date(now)
      timestamp.setDate(timestamp.getDate() - daysAgo)

      auditLogs.push({
        org_id: org.id,
        user_id: randomUser,
        action_type: action.type,
        entity_type: action.entity,
        entity_id: randomInstruction,
        details: action.details,
        created_at: timestamp.toISOString()
      })
    }

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert(auditLogs)

    if (auditError) throw auditError
    console.log(`✅ Created ${auditLogs.length} audit log entries\n`)

    // 7. Create read confirmations
    console.log('✓ Creating read confirmations...')
    const readConfirmations = []

    for (const instructionId of instructionIds) {
      // 60-90% of users have confirmed each instruction
      const confirmationRate = 0.6 + Math.random() * 0.3
      const usersToConfirm = Math.floor(userIds.length * confirmationRate)

      const shuffled = [...userIds].sort(() => Math.random() - 0.5)

      for (let i = 0; i < usersToConfirm; i++) {
        const daysAgo = Math.floor(Math.random() * 20)
        const timestamp = new Date(now)
        timestamp.setDate(timestamp.getDate() - daysAgo)

        readConfirmations.push({
          instruction_id: instructionId,
          user_id: shuffled[i],
          org_id: org.id,
          read_at: timestamp.toISOString(),
          confirmed_at: timestamp.toISOString(),
          confirmed: true
        })
      }
    }

    const { error: readsError } = await supabase
      .from('instruction_reads')
      .insert(readConfirmations)

    if (readsError) throw readsError
    console.log(`✅ Created ${readConfirmations.length} read confirmations\n`)

    console.log('✨ Demo seed completed successfully!')
    console.log(`\n📊 Summary:`)
    console.log(`   Organization: ${org.name} (${org.id})`)
    console.log(`   Teams: ${DEMO_TEAMS.length}`)
    console.log(`   Users: ${DEMO_USERS.length}`)
    console.log(`   Folders: ${DEMO_FOLDERS.length}`)
    console.log(`   Instructions: ${DEMO_INSTRUCTIONS.length}`)
    console.log(`   Audit logs: ${auditLogs.length}`)
    console.log(`   Read confirmations: ${readConfirmations.length}`)

  } catch (error) {
    console.error('❌ Error seeding demo:', error)
    process.exit(1)
  }
}

main()
