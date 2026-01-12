# Tetra – Project Context

Tetra er en digital sikkerhetsplattform for bedrifter som gjør HMS-arbeid enkelt og tilgjengelig.

## Produktmål
- Gjøre instrukser, avvik/tiltak, varsler og sikkerhetsinformasjon lett å finne og bruke
- Rollebasert opplevelse: Admin, Teamleder, Ansatt
- AI-hjelp ("Spør Tetra") basert på virksomhetens innhold (instrukser, rutiner, dokumenter)

## Roller (kort)
- Admin: organisasjon, team, innhold, tilgang, innsikt/oversikt, audit/logg
- Teamleder: team-oppfølging, status, tiltak/oppgaver, varsler
- Ansatt: finne instrukser raskt, kvittere/forstå, få varsler, spør AI

## Stack (antatt)
- Next.js (App Router) + TypeScript
- Supabase (Postgres, Auth, Storage, RLS)
- Hosting: Vercel
- AI: LLM for Q&A over interne instrukser

## Ikke-forhandlebare kvalitetskrav
- Sikkerhet først (RLS riktig, minst mulig data-eksponering)
- Stabil UX (lav friksjon, spesielt for ansatte)
- Audit på kritiske handlinger
- God "demo-flyt": enkelt å forstå på 2 minutter

## Definisjon av "ferdig"
- Funksjon virker
- Lint/type/build passerer
- Logg + handoff + TODO er oppdatert
