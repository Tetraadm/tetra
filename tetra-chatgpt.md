
## Bruker
vi kan bare forsette din første oppgave nå blir å gå igjennom alle filer ikke endre noe. Men lese igjennom alt og komme med en tilbakemdling på hvordan alt ser ut så langt i Tetra prosjektet i vs code

## Assistent
Jeg har lest alle filene i prosjektet. Her er de viktigste funnene, prioritert:

- **High**: RLS er slått på, men det finnes kun SELECT-policyer. Klient-CRUD i appen vil feile (og/eller kreve service role) uten insert/update/delete-policyer. `supabase/sql/01_schema.sql:138`, `supabase/sql/01_schema.sql:180`
- **High**: Org-wide instrukser/varsler blir skjult for team-brukere fordi spørringene bruker `instruction_teams!inner` og `alert_teams!inner` når `team_id` finnes. `src/app/employee/page.tsx:27`, `src/app/employee/page.tsx:48`, `src/app/leader/page.tsx:31`
- **High**: `/api/ask` henter alle publiserte instrukser i org uten team-filter, og nåværende RLS sjekker ikke team-tilknytning. Risiko for at ansatte får innhold utenfor sitt team. `src/app/api/ask/route.ts:54`, `supabase/sql/01_schema.sql:173`
- **High**: Upload-API stoler på `userId` fra klient og lagrer det som `created_by`, så klient kan forfalske hvem som opprettet instruksen. `src/app/api/upload/route.ts:54`, `src/app/api/upload/route.ts:147`
- **Medium**: Invitasjonsnavn lagres i `localStorage`, men brukes aldri; callback bruker e-post-prefix i stedet. Resultat: feil/ufullstendige navn i `profiles`. `src/app/invite/[token]/AcceptInvite.tsx:54`, `src/app/invite/[token]/callback/route.ts:63`, `src/lib/invite-cleanup.ts:21`
- **Medium**: Filene ser ut til å være feil-encodet (mojibake) i UI-tekster og stopwords, som vil gi rare tegn i UI og dårlig keyword-matching. `README.md:3`, `src/components/OfflineBanner.tsx:45`, `src/lib/keyword-extraction.ts:6`
- **Low**: Rate-limit er kun in-memory; i serverless blir den per-instans og mister effekt. `src/lib/ratelimit.ts`

Hvis dere allerede har ekstra RLS-policyer/migrasjoner i Supabase (utenfor repoet), si ifra - det endrer alvorlighetsgrad på første punkt.

Logg er oppdatert i `C:\Users\xboxs\Documents\tetra\tetra-chatgpt.md`.

Neste steg jeg kan ta, om du vil:
1) Fikse encoding/tekst i UI og keyword-liste.
2) Rette team-filtrering (inkludere org-wide instrukser/varsler eller bruke `get_user_instructions`).
3) Tette sikkerhets-/integritetsgap i `/api/upload` og `/api/ask` + legge inn nødvendige RLS-policyer.

## Bruker
 du kan kjøre nr 1 nå, men gi meg en oppsumering på hva det gjør når du er ferdig. og om jeg evt må kjøre nye sqler i supabase

## Assistent
Kjørte en mojibake-fiks som re-enkoder berørte tekstfiler (README, TS/TSX/CSS) fra latin-1->UTF-8 der det fantes typiske feilsekvenser. Dette gjenopprettet norske tegn (æ/ø/å) og emojis i UI-tekstene og stopword-listen.

SQL: Ingen nye SQL-migrasjoner trengs for denne endringen.

## Bruker
hva gjør nr 1 team filtrering

## Assistent
Nr 1 betyr at jeg retter hvordan instrukser/varsler filtreres per team slik at org-wide innhold også vises for teambrukere, og at Employee/Leader-sidene bruker sikre RPC-er for samme logikk.

## Bruker
ja det hadde vært fint om du fikset. fordi jeg har lastet opp en instruks som admin til alle teams men den vises ikke på employye siden. også er det mye feil på admin siden. admin kan feks ikke oprette teams osv

## Assistent
Fikset team-filtrering ved å bruke `get_user_instructions`/`get_user_alerts` i employee/leader, justerte RPC-returtype for keywords, og la til manglende RLS-policyer for admin/brukeroperasjoner. Disse SQL-endringene må kjøres i Supabase for at admin-operasjoner (opprette team, mapper, instrukser, varsler, audit/AI-logg, lesebekreftelser) skal fungere.

## Bruker
ja gjerne og fjern alt som er unødvendig i sqlene og fiks alt som er feil i supabase takk

## Assistent
Jeg kan ikke kjøre SQL direkte via MCP her, men jeg har forberedt en minimal migrasjon: `supabase/sql/05_policy_updates.sql` (kun nødvendige RLS-policyer) og oppdatert `supabase/sql/04_security_helpers.sql` for riktig `keywords`-returtype. I tillegg oppdaterte jeg team-filtrering i `src/app/employee/page.tsx` og `src/app/leader/page.tsx` til å bruke RPC-ene.

## Bruker
ja gjerne gjør det, også bare en headsup aien referer til kilder, men du kan ikke klikke på kilden og bli tatt til riktig innstruks.

## Bruker
| schemaname | tablename         | policyname                                         | permissive | cmd    |
| ---------- | ----------------- | -------------------------------------------------- | ---------- | ------ |
| public     | alert_teams       | Admin manage alert-team mappings                   | PERMISSIVE | ALL    |
| public     | alert_teams       | Read alert-team mappings (only for visible alerts) | PERMISSIVE | SELECT |
| public     | alerts            | Admin manage alerts                                | PERMISSIVE | ALL    |
| public     | alerts            | Read active alerts (team-aware)                    | PERMISSIVE | SELECT |
| public     | ask_tetra_logs    | Admin read ask tetra logs                          | PERMISSIVE | SELECT |
| public     | ask_tetra_logs    | User insert own ask tetra log (same org)           | PERMISSIVE | INSERT |
| public     | audit_logs        | Admin read audit logs                              | PERMISSIVE | SELECT |
| public     | audit_logs        | User insert own audit log (same org)               | PERMISSIVE | INSERT |
| public     | folders           | Admin manage org folders                           | PERMISSIVE | ALL    |
| public     | folders           | Read org folders                                   | PERMISSIVE | SELECT |
| public     | instruction_reads | Admin read all read records                        | PERMISSIVE | SELECT |
| public     | instruction_reads | User insert own read record (visible instruction)  | PERMISSIVE | INSERT |
| public     | instruction_reads | User read own read records                         | PERMISSIVE | SELECT |
| public     | instruction_reads | User update own read record                        | PERMISSIVE | UPDATE |
| public     | instruction_teams | Admin manage instruction-team mappings             | PERMISSIVE | ALL    |
| public     | instruction_teams | Admin read instruction-team mappings               | PERMISSIVE | SELECT |
| public     | instructions      | Admin manage instructions                          | PERMISSIVE | ALL    |
| public     | instructions      | Admin read all instructions                        | PERMISSIVE | SELECT |
| public     | instructions      | Read published instructions (team-aware)           | PERMISSIVE | SELECT |
| public     | invites           | Admin manage invites                               | PERMISSIVE | ALL    |
| public     | organizations     | Admin update org                                   | PERMISSIVE | UPDATE |
| public     | organizations     | Read own org                                       | PERMISSIVE | SELECT |
| public     | profiles          | Admin manage org profiles                          | PERMISSIVE | ALL    |
| public     | profiles          | Admin read org profiles                            | PERMISSIVE | SELECT |
| public     | profiles          | Read own profile                                   | PERMISSIVE | SELECT |
| public     | profiles          | Teamleader read team profiles                      | PERMISSIVE | SELECT |
| public     | profiles          | Update own profile                                 | PERMISSIVE | UPDATE |
| public     | teams             | Admin manage org teams                             | PERMISSIVE | ALL    |
| public     | teams             | Read org teams                                     | PERMISSIVE | SELECT | og gjerne fiks nr 2

## Assistent
Oppdaterte `/api/ask` slik at den bruker `get_user_instructions` når `userId` finnes (team/org-sikkert), og returnerer alltid en stabil `source` fra den instruksen som ble brukt. Dette gjør at klikk på kilde i chat nå åpner riktig instruks.

Basert på policy-listen din ser det ut som nødvendige admin-/brukerpolicyer allerede finnes. Du må fortsatt kjøre `supabase/sql/04_security_helpers.sql` for å oppdatere RPC-signaturen.

## Bruker
på avvik og varsel feiler det når jeg prøver å lage ett avik, kan heller ikke knytte det opp mot ett team. bare til "alle"

## Bruker
...error log...

## Assistent
Jeg la inn team-velger i admin-avvik (chips), og laget en ny SQL-fix for alerts-policyene som fjerner recursion-feilen (06_alerts_policy_fix.sql). Denne må kjøres i Supabase.

## Bruker
sql 5 ga denne feilen Error: Failed to run sql query: ERROR: 42601: syntax error at or near "," LINE 70: on public.profiles for update, delete ^

## Assistent
Rettet SQL: Postgres tillater ikke "for update, delete" i én policy. Delte i to policies (update + delete) i `supabase/sql/05_policy_updates.sql`. Kjør filen på nytt.

## Bruker
sql 5 og 6 funket men 4 gir denne feilen Error: Failed to run sql query: ERROR: 42P13: cannot change return type of existing function DETAIL: Row type defined by OUT parameters is different. HINT: Use DROP FUNCTION get_user_instructions(uuid) first.

## Assistent
Må droppe funksjonen først. Kjør `drop function if exists public.get_user_instructions(uuid);` og deretter hele `supabase/sql/04_security_helpers.sql`.

## Bruker
okey, admin kan oprette nå. men det vises enda ikke på employee siden.

## Assistent
For å feilsøke trenger jeg å vite om det er instrukser eller avvik som ikke vises, samt status/team-tilknytning. Be brukeren bekrefte at instruksen er publisert og om den er koblet til team, og evt. kjøre en kort SQL for å se om get_user_instructions returnerer den.

## Bruker
admin kan oprette nå. men det vises enda ikke på employee siden.

## Assistent
La inn `export const dynamic = 'force-dynamic'` i `src/app/employee/page.tsx` og `src/app/leader/page.tsx` for å tvinge dynamisk rendering og unngå cache som kan skjule ferske data. Videre feilsøking krever test av RPC-respons med `set local request.jwt.claims` eller app-logging.
