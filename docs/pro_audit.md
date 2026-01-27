Tetrivo HMS – Kode- og sikkerhetsrevisjon
Executive Summary
Alvorlighetsgrad Antall funn
Critical 0
High 2
Medium 4
Low 7
Info 4
Prosjektet er et moderne Next.js‑basert SaaS‑produkt med Supabase som database og autentisering,
og utstrakt bruk av Zod‑validering, rate‑limitering og sanitiseringsbiblioteker. Kodebasen viser tydelig
fokus på sikkerhet (RLS, audit‑logging, GDPR‑prosesser), men revisjonen avdekket flere svakheter som
bør adresseres. De mest alvorlige funnene er at Supabase Edge Functions mangler autentisering/
CORS‑sperrer og kan misbrukes til ressurskrevende operasjoner, samt at PDF‑prosesseringskoden i
Document   AI‑funksjonen kan forårsake minne‑ og ytelsesproblemer. Videre er innholdssikkerheten
redusert av en løs Content‑Security‑Policy og debug‑logging som viser interne detaljer i produksjon. De
fleste øvrige funn er forbedringsforslag (fjerning av deprecated funksjoner, rydde kommentarer, renske
avhengigheter) og dokumentasjonsavvik.
Topp 5 risikoer
Åpne Edge‑funksjoner uten autentisering – Supabase‑funksjonene generate‑embeddings
og process-document tillater CORS fra alle domener og validerer ikke kall med token. En
angriper kan sende store payloads og forårsake kostnader eller DoS.
Minneeksplosjon ved Document AI‑prosesser – I supabase/functions/processdocument/index.ts konverteres PDF‑filer til base64 med
String.fromCharCode(...Uint8Array) , noe som krever at hele filen lastes inn i minnet.
Store PDF‑er kan krasje funksjonen.
Svak Content‑Security‑Policy – next.config.ts bruker 'unsafe-inline' i
script-src og style-src . Dette undergraver XSS‑beskyttelsen og bør erstattes med
nonce‑basert CSP.
Manglende per‑side timeout i PDF‑parseren – API‑ruten /api/upload har bare et
total‑timeout (20 s). Uvanlige PDF‑er kan henge serveren i lang tid.
Detaljerte debug‑logger i produksjon – Flere console.log ‑kall i /api/ask/route.ts
viser intern logikk (filstier, UUIDer, antall treff), som kan lekke sensitiv informasjon til
logg‑systemer.
1.
2.
3.
4.
5.
1
Findings (detaljert liste)
F‑001 – Edge‑funksjoner kan kalles av hvem som helst
Severity: High
Kategori: Security
Lokasjon: supabase/functions/generate-embeddings/index.ts og supabase/
functions/process-document/index.ts
Problem: Begge Deno‑funksjonene returnerer CORS‑header
Access-Control-Allow-Origin: * og validerer ikke at kallet kommer fra Tetrivo. Det er
heller ingen bearer‑token eller signatur i HTTP‑kallet før funksjonen utfører kostbare
operasjoner (embedding‑generering eller Document AI‑prosessering).
Konsekvens: Eksterne angripere kan trigge embedding‑generering og dokumentprosessering
uten autentisering. Dette kan føre til økte kostnader, ressursforbruk eller denial‑of‑service.
Sannsynlighet anses medium høy fordi funksjons‑URLer kan gjettes eller lekkes.
Repro/Verifikasjon: Send en POST‑forespørsel til edge‑funksjonens URL ( https://
<project>.supabase.co/functions/v1/generate-embeddings ) med godtykkelig
payload. Funksjonen returnerer suksess uten validering.
Anbefalt fiks:
Legg til en forhåndsdelt hemmelighet (HMAC) eller JWT som må med i Authorization‑headeren
og verifiseres i starten av funksjonen.
Sett Access-Control-Allow-Origin til Tetrivo‑domenet.
Dokumenter at funksjoner bare skal kalles fra backend, og gjør dem private i Supabase
dashboard.
Quick win? Nei – krever endring i begge funksjoner og konfigurasjon i Supabase.
F‑002 – Potensiell minnelekasje ved PDF‑konvertering
Severity: High
Kategori: Performance/Reliability
Lokasjon: supabase/functions/process-document/index.ts , ca. linje 73
Problem: For å sende PDF‑en til Document AI gjøres
String.fromCharCode(...Uint8Array) for å lage base64‑streng. Denne metoden krever at
hele PDF‑filen legges i minnet som en liste med characters. Ved store filer (> 5 MB) kan dette gi
«RangeError: Maximum call stack size exceeded» eller krasj.
Konsekvens: Funksjonen kan krasje eller bruke mye minne, som igjen medfører at dokumenter
ikke prosesseres eller at hele edge‑miljøet feiler. Impact potensielt høy; sannsynlighet medium.
Repro/Verifikasjon: Kjør funksjonen med en 20 MB PDF. Deno‑funksjonen vil henge eller kaste
RangeError.
Anbefalt fiks: Bruk en strømbasert base64‑encoder
( Buffer.from(arrayBuffer).toString('base64') eller streaming) i stedet for å spre
arrayet via String.fromCharCode . Vurder å avvise filer over en trygg grense.
Quick win? Ja – endring av konverteringsfunksjonen er liten.
F‑003 – Content‑Security‑Policy tillater inline‑skript
Severity: Medium
Kategori: Security/Config
Lokasjon: next.config.ts
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
2
Problem: CSP‑headeren inkluderer "script-src 'self' 'unsafe-inline'" og "stylesrc 'self' 'unsafe-inline'" . Selv om Next.js krever dette i dag, åpner det for at injiserte
skript kan kjøre dersom det finnes XSS‑sårbarheter. Headeren har TODO‑kommentar om nonce.
Konsekvens: Dersom en angriper finner et XSS‑injektionspunkt (for eksempel via
tredjepartsbiblioteker), kan inline‑restriksjonen utnyttes til å kjøre ondsinnet JavaScript. Impact
medium, sannsynlighet avhenger av andre bugs.
Repro/Verifikasjon: CSP‑headeren er synlig i devtools når appen kjører; den tillater
inline‑kodesnutter.
Anbefalt fiks: Implementer CSP med nonces ( next.config.js tilbyr cspNonce ) og fjern
'unsafe-inline' . Ekstraher kritiske inline‑skript til egne filer eller bruk React‑props for
event‑handlers. Oppdater dokumentasjonen for å nevne CSP.
Quick win? Nei – krever gjennomgang av frontend og Next.js‑konfig.
F‑004 – Kommentar i middleware stemmer ikke med implementasjon
Severity: Medium
Kategori: Docs/Config
Lokasjon: src/middleware.ts
Problem: Kommentarene øverst sier at «/admin/», «/employee/» og «/leader/*» er beskyttede
ruter, men selve koden beskytter ruter som starter med /instructions , /portal og /
deviations . I dagens rutelayout tilsvarer dette riktige stier (parentes‑segmentene i app/
(platform) fjernes), men andre som vedlikeholder koden kan bli forvirret og glemme å
beskytte nye stier.
Konsekvens: Fremtidige ruter (f.eks. /analytics ) kan bli glemt og eksponert uten
autentisering. Impact medium, sannsynlighet medium på lengre sikt.
Repro/Verifikasjon: Les middleware.ts – kommentar og kode avviker.
Anbefalt fiks: Oppdater kommentarene til å matche den faktiske matchelogikken (beskriv
hvordan (platform) ‑mapper blir til /<route> ). Legg til enhetstester for middleware slik at
nye ruter dekkes.
Quick win? Ja – bare dokumentasjon.
F‑005 – Manglende per‑side timeout ved PDF‑parsing
Severity: Medium
Kategori: Performance/Reliability
Lokasjon: src/app/api/upload/route.ts , linje 46–92
Problem: PDF‑opplasting bruker pdf-parse med et globalt timeout ( PDF_TIMEOUT_MS =
20 000 ms) for å avbryte hele prosessen. Det finnes ingen per‑side‑timeout, slik
improvement‑planen (P0‑3) anbefaler. Kompleks eller korrupte PDF‑er kan forbruke hele
timeout‑budsjettet før én enkelt side er ferdig.
Konsekvens: API‑ruten kan henge i mange sekunder eller time ut helt, noe som gir dårlig
brukeropplevelse og øker risikoen for DoS. Impact medium, sannsynlighet medium.
Repro/Verifikasjon: Last opp en PDF med svært mange eller komplekse sider; prosessen
henger inntil total timeout.
Anbefalt fiks: Sett en per‑side‑timeout via pdf‑parse config (f.eks. custom loading function), eller
abort parsing etter X ms per side. Returner en feilmelding med forslag om manuell tekst.
Quick win? Nei – krever endring av PDF‑parsering.
F‑006 – Debug‑logging i produksjonskode
Severity: Medium
Kategori: Security/Logging
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
3
Lokasjon: src/app/api/ask/route.ts (flere linjer), src/app/api/upload/route.ts
(PDF‑logging)
Problem: Filer inneholder console.log ‑kall som viser interne variabler (liste over filstier,
UUIDer, antall treff, PDF‑sider). Disse kjøres i alle miljøer, ikke bare under utvikling.
Konsekvens: I produksjon vil detaljert intern informasjon havne i loggsystemer. Dette kan lekke
metadata om dokumenter eller interne prosesser, og kan være nyttig for angripere som
enumererer ID‑er. Impact medium, sannsynlighet høy (koden kjøres alltid).
Repro/Verifikasjon: Søk etter '[ASK_DEBUG]' og andre console.log ‑kall i koden – de er
ikke bak en if (process.env.NODE_ENV… ) .
Anbefalt fiks: Fjern eller erstatt debug‑logging med logger.debug() som respekterer
LOG_LEVEL . Eller pakk debug‑logger i if (process.env.NODE_ENV !== 'production') .
Quick win? Ja – fjerning av console.log er enkel.
F‑007 – Deprecert audit‑loggfunksjon kan misbrukes
Severity: Low
Kategori: Security/Code Quality
Lokasjon: src/lib/audit-log.ts
Problem: Filen eksporterer logAuditEventClient , en klient‑side funksjon som skriver
audit‑logger direkte fra nettleseren. Kommentarer advarer om at den er deprecated og at
audit‑logging skal gå via /api/audit på serveren, men funksjonen er fortsatt tilgjengelig.
Konsekvens: Uerfarne utviklere kan gjeninnføre funksjonen og gjøre audit‑logging
manipulérbar fra klienten. Impact lav, sannsynlighet lav.
Repro/Verifikasjon: Se export i audit-log.ts .
Anbefalt fiks: Fjern funksjonen helt eller kast en exception hvis den kalles. Legg til ESLint‑regel
som forbyr bruken.
Quick win? Ja.
F‑008 – Løse miljøvariabel‑navn og eksempelverdier
Severity: Low
Kategori: Docs/Compliance
Lokasjon: .env.example , README.md
Problem: Eksempel‑filen viser API‑nøkler med prefikset sk-… og navnet
NEXT_PUBLIC_SUPABASE_ANON_KEY . Prefikset NEXT_PUBLIC_ inviterer til å bruke verdien i
frontend, men anon_key gir fortsatt database‑tilgang og bør håndteres som sensitiv.
Kommentarer kunne vært tydeligere på at disse ikke skal lekke.
Konsekvens: Utviklere kan misforstå anon ‑nøkkelen som usensitiv og eksponere den i
klientkode eller supportskjermbilder. Impact lav, sannsynlighet medium.
Repro/Verifikasjon: Les .env.example – nøkler omtales ikke som sensitive.
Anbefalt fiks: Legg til tydelig advarsel i .env.example og README om at
NEXT_PUBLIC_SUPABASE_ANON_KEY og andre API‑nøkler er hemmelige og ikke må deles.
Oppdater .gitignore til å inkludere .env* .
Quick win? Ja.
F‑009 – Ubrukte eller overflødige avhengigheter
Severity: Low
Kategori: Code Quality/Dependency Risk
Lokasjon: package.json
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
4
Problem: Pakker som @google-cloud/discoveryengine og @google-cloud/vertexai
er listet som avhengigheter, men det er ingen referanser til dem i koden. Ubrukte avhengigheter
øker angrepsflaten og vedlikeholdskostnader.
Konsekvens: Potensielle sikkerhetshull fra ubrukte libs, lenger byggtid, unødvendige
CVE‑varsler. Impact lav, sannsynlighet medium.
Repro/Verifikasjon: Søk i repo etter discoveryengine – ingen bruk funnet.
Anbefalt fiks: Fjern ubrukte avhengigheter fra package.json og package-lock.json . Kjør
npm prune etterpå.
Quick win? Ja.
F‑010 – Legacy filer og interne regler
Severity: Low
Kategori: Code Hygiene
Lokasjon: .cursorrules i rotmappen
Problem: Filen beskriver «Antigravity Agent Rules» med referanser til .agent ‑katalog og
interne retningslinjer. Dette ser ut til å være en intern agent fra et annet prosjekt og er ikke
relevant for Tetrivo‑koden.
Konsekvens: Forvirring for nye utviklere og risiko for å introdusere konfidensielle retningslinjer i
et produksjonsrepo. Impact lav.
Repro/Verifikasjon: Se innholdet i .cursorrules .
Anbefalt fiks: Fjern .cursorrules fra repoet eller flytt det til intern dokumentasjon som ikke
deployes.
Quick win? Ja.
F‑011 – Utilstrekkelig fallback for rate‑limiter i produksjon
Severity: Low
Kategori: Reliability/Config
Lokasjon: src/lib/ratelimit.ts
Problem: Dersom UPSTASH_REDIS_REST_URL og token mangler i produksjon, opprettes en
MisconfiguredRatelimit som alltid returnerer 503 på alle requests. Dette «fail‑closed» kan
lamme alle API‑ruter hvis en miljøvariabel skrives feil.
Konsekvens: Systemet blir helt utilgjengelig uten tydelig feilmelding. Impact lav, sannsynlighet
lav (krever feil konfig).
Repro/Verifikasjon: Sett NODE_ENV=production og fjern Upstash‑variabler; alle API‑ruter
returnerer 503.
Anbefalt fiks: Logg tydeligere hva som er feil i miljøet. Vurder å falle tilbake til in‑memory rate
limiter med et varsel i stedet for full stans.
Quick win? Ja – endring av fallback logikk.
F‑012 – Flere identifiserte UI‑bugs ikke løst
Severity: Low
Kategori: Bug/UI
Lokasjon: Se docs/IMPROVEMENT_PLAN.md under «UI‑Bugs»
Problem: Dokumentasjonen peker på bugs som «bell‑knappen har ingen funksjon», «logout
viser feilmelding selv ved suksess» og flere Radix UI‑problemer. Disse er ennå ikke merket som
løst i kodebasen.
Konsekvens: Dårlig brukeropplevelse, økt supportbelastning. Ikke sikkerhetskritisk, men
påvirker tilliten til plattformen. Impact lav.
Repro/Verifikasjon: Følg trinnene i improvement‑planen og test komponentene i mobil‑modus.
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
5
Anbefalt fiks: Prioriter bugfixing av listede UI‑problemer, spesielt rad-baserte modals og
select‑komponenter.
Quick win? Delvis – noen bugfixes krever mer arbeid.
F‑013 – Overdreven logging av PDF‑detaljer
Severity: Low
Kategori: Privacy/Logging
Lokasjon: src/app/api/upload/route.ts linje 137 («[PDF] Extraction success. Pages: …
Chars: …»)
Problem: Etter parsing logges antall sider og tegn i PDF‑er. Selv om innhold ikke logges, kan
metadata røpe størrelse og antall sider i konfidensielle dokumenter.
Konsekvens: Opplysninger om dokumentenes omfang kan lekke til tredjeparts logganalyse.
Impact lav, sannsynlighet medium.
Repro/Verifikasjon: Loggene viser [PDF] Extraction success. Pages: … Chars: … i
serverkonsollen.
Anbefalt fiks: Fjern eller senk loggnivået, og maskér filnavn og størrelse. Bruk
logger.debug() for utvikling.
Quick win? Ja.
F‑014 – Uklare ansvarsområder i improvement‑planen
Severity: Info
Kategori: Project Management
Lokasjon: docs/IMPROVEMENT_PLAN.md
Problem: Dokumentet blander funksjoner som allerede er implementert (P0‑1 og P0‑2) med
fremtidige oppgaver, og noen anbefalinger («AI‑migrering til Gemini») er ikke reflektert i koden
ennå.
Konsekvens: Utviklere kan bli usikre på hva som er ferdig og hva som gjenstår. Impact liten.
Repro/Verifikasjon: Sammenlign plan med api/instructions som allerede genererer
chunks.
Anbefalt fiks: Oppdater improvement‑planen til å markere ferdigstilte punkter, flytt gjenstående
til issues i backlog.
Quick win? Ja.
Repo Map & Stack
Toppnivå‑struktur:
src/ – Next.js app‑router basert front‑/back‑end (TypeScript). Underkatalogen app
inneholder sidekomponenter og API‑ruter. components og lib huser UI‑elementer og
fellesbiblioteker.
supabase/ – SQL‑migrasjoner, row‑level policies og edge‑funksjoner. Inneholder funksjoner
for Google Document AI og embeddings.
tests/ – Vitest‑ og Playwright‑tester; rls‑tester bekrefter at RLS isolerer multi‑tenant data.
docs/ – Dokumentasjon for sikkerhet, forbedringsplan og prosessbeskrivelser.
scripts/ – Engangsskript for backfill og reindeksering.
.github/workflows/ – Kun gdpr-cleanup.yml for månedlig loggrydding via
GitHub Actions.
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
•
6
Språk & rammeverk:
Frontend/back‑end: Next.js 16 med React 19 og TypeScript.
Database: Supabase/PostgreSQL med pgvector, omfattende RLS (Row Level Security).
Autentisering: Supabase Auth (JWT) med Supabase‑client i Next.js. Ruter bruker
createClient() for brukerens kontekst og createServiceRoleClient() for
admin‑operasjoner.
AI‑integrasjoner: OpenAI for embeddings; Vertex AI/Document AI via Google Cloud; Anthropic
(legacy) nevnt men ikke lenger i bruk.
Logging: Pino‑basert modul ( src/lib/logger.ts ) og Sentry konfig for klient, server og
edge.
CI/CD: GitHub Actions jobber kun for GDPR cleanup.
Miljøer: .env.example beskriver dev/prod variabler; GDPR_CLEANUP_SECRET brukes av
cron; NODE_ENV styrer rate‑limiter fallback.
Patch Plan
Wave 1 – Kritiske sikkerhetsfiks (Høy prioritet)
Funn Estimat Beskrivelse
F‑001
(Edge‑funksjoner
uten auth)
M
Implementer token‑basert autentisering for
generate‑embeddings og process-document . Konfigurer
funksjonene som private i Supabase. Restrikt CORS til ditt
domene.
F‑002 (PDF
minne‑bug) S
Bytt ut base64‑konvertering til
Buffer.from(bytes).toString('base64') eller
stream‑basert variant i process-document . Sett en maksimum
filstørrelse.
F‑003 (CSP) M
Implementer nonce‑basert CSP i next.config.ts . Refaktorer
inline‑skript/stiler.
F‑005 (PDF per‑side
timeout)
M
Legg til per‑side abort i PDF‑parser; vurder alternative parsere
med avbruddsstøtte.
Wave 2 – Stabilitet & større bugs
Funn Estimat Beskrivelse
F‑006 (Debug‑logger) S
Fjern console.log ‑kall eller skjerm dem med miljøsjekk;
bruk logger.debug i dev.
F‑007 (Deprecated
audit‑funksjon) S
Fjern logAuditEventClient eller gjør den utilgjengelig;
oppdater dokumentasjon.
F‑009 (Ubrukte
dependencies) S
Rens package.json for ubrukte Google‑libs; kjør npm
prune .
F‑010 (Utdatert
.cursorrules )
S Slett filen eller flytt til intern dokumentasjon.
•
•
•
•
•
•
•
7
Funn Estimat Beskrivelse
F‑011 (Rate‑limit fallback) S
Endre fallback til å logge misconfig og bruke in‑memory
limiter i nødstilfelle; legg til monitorering.
F‑013 (PDF‑metadata
logges) S Reduser loggnivå og maskér metadata i upload ‑ruten.
Wave 3 – Refaktorering, UI & dokumentasjon
Funn Estimat Beskrivelse
F‑004
(Middleware‑kommentarer) S
Oppdater kommentarene for å reflektere faktiske
stier; skriv test for middleware.
F‑008 (Miljøvariabel‑klarhet) S
Legg til sikkerhetsadvarsel i .env.example ;
oppdater README.
F‑012 (UI‑bugs) M–L
Fiks listede UI‑feil i IMPROVEMENT_PLAN.md ; test
spesielt Radix‑komponenter på mobil.
F‑014 (Improvement‑plan
opprydding) S Marker utførte punkter og flytt rester til issue‑tracker.
F‑016 (Sentry‑konfig) S
Sikre at NEXT_PUBLIC_SENTRY_DSN og
SENTRY_PROJECT er satt i prod.
Generelt M
Implementer MFA for admin‑brukere, CSP‑nonces og
ytterligere sikkerhetstiltak nevnt i docs.
Ved å adressere funnene i wave 1 oppnår prosjektet en trygg basis hvor edge‑funksjoner ikke kan
misbrukes og ressurs‑tunge operasjoner håndteres riktig. Wave 2 fokuserer på opprydding av kode og
konfigurasjon som forbedrer robustheten, mens wave   3 handler om klarere dokumentasjon og
UX‑forbedringer.
Når alle bølger er implementert, bør man re‑gjennomføre sikkerhetstesting (inkludert penetration‑test
og automatiserte verktøy) for å verifisere at nye endringer ikke introduserer nye sårbarheter.
8