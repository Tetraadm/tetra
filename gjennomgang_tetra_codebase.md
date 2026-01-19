Gjennomgang av Tetra HMS-kodebasen – pilotklarhet og sikkerhetsrevisjon (januar 2026)
A. Executive Summary (maks 10 punkter)

Invitasjoner og roller (kritisk) – API‑ruten invite/route.ts tillater både admin og teamleader å sende invitasjoner, men RLS‑policyen i databasen tillater bare admin å skrive til tabellen invites. Dette fører til feil for teamledere og åpner for misforståelser. Teamledere kan også foreslå rollen admin på nye brukere, noe som burde forbys.

Manglende validering av team‑IDer ved opplasting – upload/route.ts validerer at brukeren er admin i angitt organisasjon, men kontrollerer ikke at teamIds faktisk tilhører samme organisasjon. Feil team‑ID kan føre til at instruksjoner ikke vises for noen eller knyttes til feil org/tenant (innsyns‑ og integritetsrisiko).

Rett til å registrere lesing uten org‑kontroll – confirm-read/route.ts oppdaterer instruction_reads uten å verifisere at instruksjonen ligger i brukerens org. RLS hindrer trolig handlingen, men brukeren får generisk 500-feil. API bør gi tydelig 403 dersom org mismatcher.

Ikke full dekning av CI/CD – Github‑workflowen kjører kun lint, type‑sjekk og bygg. Det finnes ingen automatiske tester, statisk analyse av SQL/RLS, migrasjonssjekk eller SAST. For en B2B pilot bør basis‑testdekning og migrasjonsvalidering implementeres.

Rate‑limiter konfigurasjon – fallback‑mekanismen i ratelimit.ts slår helt av rate‑limiting hvis Upstash ikke er konfigurert korrekt. I produksjon kan feilkonfigurasjon bety at API‑ene ikke er beskyttet mot DoS eller misbruk; det kreves overvåking og varsel.

Manglende testdekning og dokumentasjon – Flere av migrasjonene retter tidligere alvorlige feil (f.eks. manglende lagringspolicyer) og indicate at systemet fortsatt modnes. Ingen enhetstester for RLS, API‑ruter eller UI betyr at feil kan dukke opp i pilot.

Avhengighet til service‑rolle‑nøkkel – Opplasting av filer bruker service‑rolle for å skrive til Supabase storage. Eventuell lekkasje av service‑roll‑nøkkel gir total tilgang til databasen. Koden logger feil grundig, men man bør bruke separate funksjonsnøkler, minst mulig privilegium og sikre at nøkkelen ikke eksponeres.

Frontend‑sider henter store dataset – Admin‑ og ledernivå sider (/admin, /leader, /employee) henter opptil 200 objekter uten server‑paginasjon. Dette kan gi treghet og ikke skalerer ved mange instruksjoner/brukere. Pilot bør innføre paginering.

Mangel på datalagrings‑ og slette‑rutiner – Selv om det finnes deleted_at for enkelte tabeller, er det uklart om persondata i audit‑logger eller AI‑logg slettes etter GDPR‑krav. Manglende eksport/slette‑funksjon kan hindre pilot hos kunder med strenge personvernkrav.

CI secrets og miljøfiler – README beskriver miljøvariabler, men ingen .env.example leveres, og CI bruker dummy‑verdier. Det kan føre til feil konfigurasjon ved onboarding av nye utviklere; holdbar bruk av hemmeligheter og miljø‑templates trengs.

B. Repo‑kart (arkitektur)
Komponent	Beskrivelse
Frontend (Next.js 16/React 19)	Ligger under src/app. Bruker serverkomponenter med supabase‑klienter for server og klient. Pages /admin, /leader, /employee henter data med Supabase server‑klient og viser dashboards og lister av instrukser, lagringsobjekter og AI‑logger.
API‑ruter	Under src/app/api finnes ruter for invite, upload, ask, audit-logs, confirm-read, read-confirmations, m.fl. Bruker createServerClient med cookie‑basert auth, raterestriksjoner med Upstash, zod‑validering og sikkerhetsdefinerte SQL‑funksjoner.
Supabase DB	SQL‑filer i supabase/sql definerer skjema, RLS‑policyer, migrasjoner, funksjoner og triggers. Tabellen organizations, teams, profiles, folders, instructions, alerts, invites, instruction_reads, audit_logs m.fl. RLS med my_org_id() sikrer multi‑tenant isolasjon. Soft delete (deleted_at) på enkelte tabeller.
RLS og sikkerhetsfunksjoner	04_security_helpers.sql implementerer get_profile_context(), get_user_instructions(), get_user_alerts() med SECURITY DEFINER og sjekker auth.uid(). Migrations 14_rls_optimization.sql og 15_policy_consolidation.sql optimaliserer policyer ved å bruke my_org_id().
Lagring (Supabase storage)	Policies definert i 19_storage_policies_complete.sql og 20_apply_storage_policies.sql tillater kun org‑medlemmer å lese sine filer og kun admins å skrive og slette innen egen org. Opplasting skjer via service‑rolle i API.
CI/CD	.github/workflows/ci.yml kjører lint, type‑sjekk og build med dummy‑nøkler. Ingen testkjøring eller migrasjons‑sjekk. Deploy gjøres via Vercel (ikke i repo).
Logging og auditing	audit_logs tabell lagrer hendelser; API for å hente logs (kun admin). ask_tetra_logs og ai_unanswered_questions loggfører AI‑spørringer. Klientfunksjon logAuditEventClient (src/lib/audit-log.ts) setter audit‑logg.
Rate‑limiting	Upstash Redis via @upstash/ratelimit med fallback til memory. Ruter upload, invite og ask har egne limiter.
C. Funnliste (tabell)
ID	Severity	Område	Fil/sted	Problem (kort)	Fix (konkret)	Status
1	Critical	API/RLS	src/app/api/invite/route.ts & RLS	Teamleaders kan sende invitasjon – API tillater teamleader, men RLS i DB hindrer alt annet enn admin. Kan føre til feilmeldinger og forvirring.	Endre API til å kun tillate admin. Hvis teamledere skal invitere, må RLS oppdateres med granular policy der teamledere kun kan invitere employee til egne team.	Blocker
2	High	API/DB	src/app/api/invite/route.ts	Ingen validering av role på invitasjon; teamledere kan forsøke å invitere med høyere rolle.	Legg inn sjekk: if (profile.role === 'teamleader' && invite.role !== 'employee') throw 403;. Oppdater DB‑constraint om nødvendig.	Blocker
3	High	API/RLS	src/app/api/upload/route.ts	teamIds valideres ikke; de kan tilhøre en annen org. RLS vil avslå, men gir generisk feil og kan lagre ubrukelig data.	Før insert, verifiser at alle teamIds har org_id = profile.org_id via supabase-spørring; returner 400 ved mismatch.	Blocker
4	Medium	API/RLS	src/app/api/confirm-read/route.ts	Oppdaterer instruction_reads uten å sjekke at instructionId tilhører brukerens org.	Før upsert, gjør en select på instructions med id=instructionId og org_id=profile.org_id; returner 403 dersom ikke finnes.	Blocker
5	Medium	CI/CD	.github/workflows/ci.yml	Ingen enhetstester, migrasjonstester, sikkerhetsskanning.	Legg til jest/playwright/Cypress tester, integrasjonstester for RLS & API, og automatiske migrasjonssjekker. Kjør disse i CI med reelle testmiljøer.	Non-blocker
6	Medium	Observability	ratelimit.ts	Hvis Upstash ikke er riktig konfigurert, deaktiveres rate‑limiting helt.	Varsle via monitoring når fallback er aktiv; avbryt API‑kall i produksjon hvis limiter er misconfig.	Non-blocker
7	Medium	Data personvern	SQL migrasjoner & API	Ikke spesifisert retention eller sletting for audit_logs, ask_tetra_logs eller brukerprofiler. GDPR krever begrenset lagring.	Implementer tidsbasert slettingsstrategi (f.eks. 90 dager) og mekanisme for eksport og sletting av brukerdata.	Non-blocker
8	Medium	UI/UX	`src/app/(admin	leader	employee)/page.tsx`	Forespørsler henter opptil 200 rader uten paginering. Ved mange instruksjoner kan sider laste tregt.
9	Low	RLS	SQL (migrasjoner)	Mange policies er nylig konsolidert; endringer i funksjoner som my_org_id() kan ha konsekvenser.	Foreslå enhetstester for RLS for å verifisere at ingen utilsiktede hull oppstår; bruk Supabase anbefalte testoppsett.	Non-blocker
10	Low	Dokumentasjon/Onboarding	README & manglende .env.example	Mangler miljøvariabelmal; nye utviklere kan feilkople seg; CI bruker dummy secrets.	Legg til .env.example med forklaring på variabler; beskytt secrets via Vercel secrets; oppdater README.	Non-blocker
11	Low	API	upload/route.ts	Bruk av service‑rolenøkkel i kode gir høy risiko ved eventuelt lekkasje.	Bruk dedikert funksjonsnøkkel via Supabase «Edge Functions» eller Storage service med minimal tilgang; la Next‑server ta hånd om fil‑opplasting uten eksponering av service‑rolle.	Non-blocker
12	Low	Frontend	Formularer & error‑handling	Få tilbakemeldinger til brukere ved RLS‑feil kan være generiske; ubruker-vennlig.	Differensier 403 (mangler tilgang) og 500 (serverfeil) i API‑ruter; gi tydelig melding i frontend.	Non-blocker
13	Low	Infrastructure	Logging & secrets	Logging av feil kan inneholde sensitive detaljer (f.eks. opplasting mislykket med filnavn og text).	Fjern sensitive verdier i logs; masker filstier, e‑post osv.	Non-blocker
14	Low	Performance	SQL migrasjoner	Mangler test på tunge queries; get_user_instructions kan bli treg ved mange rader.	Legg til indekser på instructions.updated_at og keywords (allerede delvis gjort); evaluer query‑planer.	Non-blocker
D. Kritiske blockers (P0)

Følgende må løses før pilot:

Align invitajons-API med RLS – Stram inn invite/route.ts til kun admin eller oppdater RLS for å tillate teamledere til å invitere under strenge betingelser. Legg validering på hvilken rolle som kan gis. Dette er nødvendig for at invitasjoner skal fungere og unngå feil.

Valider teamIds i opplasting – Verifiser at alle team‑IDer tilhører brukerens org i upload/route.ts før det opprettes koblinger.

Sjekk instruksjonsorg ved «confirm-read» – Før upsert i confirm-read/route.ts må API sjekke at instructionId finnes i samme org som brukerens profil.

Sikker opplasting med service‑rolle – Sørg for at service‑rollenøkkel ikke brukes direkte i Next‑API. Bruk Supabase Edge Function eller annen backend for opplasting med minst mulig privilegium.

Sikre rate‑limiter – Aktiver overvåking av rate‑limit fallback og stopp API‑trafikk hvis limiter er deaktivert.

E. Forbedringer (P1/P2)

P1 (høy prioritet etter blockers):

Utvid CI/CD med enhetstester og automatiske integrasjonstester mot Supabase; kjør migrasjoner i testmiljø.

Implementer GDPR‑slette‑rutiner og tidsbegrenset lagring for logs.

Legg inn paginering og filtrering i UI og API.

Legg til .env.example og dokumentasjon; opprett bedre onboarding‑guide.

Overvåk fil‑opplastingsrutiner og logg mislykkede opplastinger uten sensitiv data.

Forbedre rollestyring; gi teamledere egne API‑endepunkt for teaminvitasjoner.

Etterse alle RLS‑policyer ved endringer i funksjoner; sett opp automatisk DB‑analyse.

P2 (lavere prioritet / senere forbedringer):

Optimaliser spørringer med flere indekser; analyser get_user_instructions ved mange brukere.

Implementer feature for eksport av data (organisasjon, instruksjoner) og brukerselvbetjent sletting.

Forbedre UI/UX med søk, tags og forbedret feilhåndtering.

Integrer overvåking/alerting (Prometheus/Grafana/Sentry) og logg aggregator for sporing av feil og misbruk.

F. Pilot Readiness‑score (0–100)
Kategori	Score (0‑100)	Begrunnelse
Sikkerhet	65	RLS og lagringspolicyer er godt tenkt ut og det finnes sikkerhets‑definerte funksjoner. Men flere misalignment mellom API‑ruter og RLS (invites, upload) skaper risiko for feil eller bypass. Service‑rolle i kode er potensielt farlig, og rate‑limiter kan feile.
GDPR/Personvern	60	Tabeller har deleted_at og audit‑logg, men det mangler sletterutiner, eksportfunksjoner og tydelig dataminimering. Lagring av AI‑spørringer og audit‑logger uten retention kan bryte personvern.
Multi‑tenant isolasjon	80	my_org_id() og konsoliderte policyer gir god isolasjon, og lagringspolicyer begrenser tilgang til org‑spesifikke filer. Men opplasting med feil team‑ID og invites‑feil kan underminere isolasjonen.
Stabilitet	70	Robust error‑håndtering i API og fallback for rate‑limiter. Manglende testdekning og modenhet (migrasjoner fixet flere feil) reduserer stabilitet.
Testdekning	30	Ingen automatiske tester. Pilot bør ha minst integrasjonstester for RLS/SQL.
Observability	50	Audit logs og AI‑logs finnes, men ingen ekstern overvåkning, varslingssystemer eller rate‑limit‑monitoring.
UX	70	Moderne Next.js/React UI, men mangler paginering og granulære feilmeldinger.
Deploy/Config	60	CI/CD fungerer kun for byggeprosessen; ingen migrasjon eller test i pipeline. Mangler .env.example.

Total Pilot Readiness: ≈61 / 100 – Solid grunnmur (Supabase RLS, moderne stack), men flere kritiske hull i API‑validering, testdekning og GDPR‑håndtering trekker ned. For å nå >90 må de identifiserte P0‑blockers løses, testdekning bygges ut, personvern‑rutiner etableres og CI/CD forbedres.

Hvordan øke scoren med 10 poeng per kategori:

Sikkerhet: Løs misalignment i invites og upload, fjern service‑rollen fra frontend/serverkoden og implementer strenge least‑privilege nøkler (+10 poeng).

GDPR: Implementer mekanismer for å slette/eksportere persondata; definér retention for logs (+10 poeng).

Multi‑tenant: Tilpass API‑validering for team‑IDer og invites; skriv tester som verifiserer isolasjon (+10 poeng).

Stabilitet: Introducer end‑to‑end tester og monitorering; implementer fallback‑varsler for rate‑limiter (+10 poeng).

Testdekning: Skriv integrasjonstester for RLS, funksjonelle API‑tester og unit‑tester på frontend; kjør i CI (+20 poeng, stor gevinst).

Observability: Innfør sentralisert logging og alarmer (Sentry/Grafana); overvåk Upstash, AI‑bruk og feil (+10 poeng).

UX: Legg til paginering, bedre feilmeldinger og rollestyrt UI; bruk analytics til å måle brukeropplevelse (+5 poeng).

Deploy/Config: Legg til migrasjonsvalidering i CI, .env.example og bruk secrets‑manager; opprett preview‑miljø med datamaskert testdata (+10 poeng).

G. Pilot‑plan (1–2 uker)
#	Oppgave	Estimert kompleksitet	Risiko
1	Invitasjon‑fix: Oppdater API og DB‑policyer for invites til å være i samsvar; legg rollevalidering for teamledere.	M	Medium – involverer både backend‑kode og SQL‑migrasjon.
2	Team‑validering i upload: Legg supabase‑spørring som validerer at alle teamIds tilhører profile.org_id før insert.	S	Lav – enkelt API‑endring.
3	Org‑sjekk i confirm‑read: Legg til sjekk at instructionId tilhører riktig org; returner 403 ved mismatch.	S	Lav.
4	Service‑rolle erstatning: Flytt fil‑opplasting til Supabase Edge Function med EXECUTE AS og scope‑begrensning; fjern service‑rolle fra Next‑kode.	M	Medium – krever DevOps og endring av deploy.
5	Rate‑limit‑monitorering: Implementer monitorering/alarmer på Upstash fallback og stopp API ved misconfig.	S	Lav.
6	CI/CD‑forbedring: Legg til testløp (Jest/Cypress), migrasjonssjekk og SAST i workflow.	M	Medium – krever skriving av tester og pipeline‑endring.
7	GDPR‑rutiner: Design og implementer datalagring‑ og sletting/pseudonymiseringsstrategi for audit og AI‑logger; utarbeid eksport‑API.	M/L	Medium til høy – krever forretningsavgjørelser og juridisk vurdering.
8	Pagineringsfunksjon: Legg til server‑side paginering i API‑ruter og UI‑komponenter.	S/M	Moderat – påvirker UI og backend.
9	Test‑suite: Lag grunnleggende enhetstester for RLS (using pgTap), API‑ruter og frontend; integrer i CI.	M/L	Høy – krever testinfrastruktur.
10	Dokumentasjon og .env.example: Lag eksempel‑fil med beskrivelser av variabler; oppdater README med pilot‑instruksjoner.	S	Lav.
11	Observability: Koble til Sentry og Grafana for logging og metrics; lag dashboards for AI‑bruk, feilrater, raterestriksjoner.	M	Medium.

Tidsestimat: Oppgaver 1–5 er høyest prioritet og kan utføres i løpet av første uke. Oppgaver 6–11 kan starte parallelt og fullføres innen to uker med et lite team. Etter dette bør pilot score kunne økes til over 90.