TETRA – WORKSPACE RULES (UFRAVIKELIG)

KONTEKST / MÅL
- Mål: Pilot-klar enterprise SaaS HMS-plattform med høy sikkerhet og vedlikeholdbarhet.

A) OBLIGATORISK OPPSTART (FØR DU ENDRER KODE)
1) Kartlegg repo:
   - Les tree for: src/app/*, src/lib/*, supabase/sql/*
   - Pek ut “ryggraden”: auth, data access, RLS/RPC, audit, upload, ask.
2) Velg riktig workflow/skill:
   - Les .agent/skills/ og .agent/workflows/ (hvis de finnes) og bruk dem.
3) Før større refaktor:
   - Skriv en P0/P1/P2-plan med done criteria og berørte filer.

B) FILSTØRRELSE OG SPLITTING
- Soft cap: 400 linjer. Hard cap: 600 linjer.
- Over hard cap krever:
  1) forklaring før endring
  2) kommentar øverst:
     // @ai-justification: Beholdes i én fil fordi [konkret begrunnelse]
- Splitt etter ansvar:
  - hooks/ (state + side effects)
  - components/ (presentational)
  - lib/ (utils)
  - types/ (deling av typer)

C) ARKITEKTURPRINSIPP
- Logic/View separation:
  - Container: data fetching + state + hooks
  - Presentational: props-only UI
- Colocation:
  - Feature-spesifikke komponenter bor nær feature.
  - src/components/* skal kun ha genuint delte komponenter.

D) SIKKERHET (ZERO TRUST)
1) RLS er sannhet:
   - Alle tabeller skal ha RLS.
   - All tilgang kontrolleres på DB-nivå (org_id + rolle/team).
   - UI-sjekker er kun UX; backend må alltid verifisere auth.uid() + rolle mot DB.
2) SECURITY DEFINER / RPC:
   - SECURITY DEFINER kun når nødvendig (RLS-rekursjon/privileged).
   - Alltid: SET search_path (minst public, pg_catalog).
   - Der relevant: REVOKE/GRANT eksplisitt.
3) Service role:
   - Kun på server (server actions / route handlers), aldri i client bundles.
   - Kun når nødvendig (f.eks. storage-operasjoner). Ekstra kontroller (rolle/org) før bruk.
4) Inputvalidering:
   - Alle API routes/server actions: Zod schema før bruk.
5) AI-sikkerhet:
   - “Spør Tetra” skal alltid: kun bruke dokumentkontekst, ikke ekstern kunnskap.
   - Sanitér brukerinput og logg ikke rå prompt som kan inneholde PII.

E) AUDIT / GDPR
- Alle Create/Update/Delete + sensitive reads skal logges i audit-logg.
- Aldri logg tokens, passord eller sensitive felt i klartekst.
- Soft-delete mønstre skal respekteres i queries/policies der det brukes.

F) DATABASE / MIGRATIONS (Repo A)
- Supabase SQL-migrasjoner i supabase/sql/* er styrende historikk:
  - Ikke “rewrite” gamle migrasjoner i prod-løp uten å forklare konsekvenser.
  - Nye endringer: lag ny migrasjonfil med tydelig navn og kommentar-header.
- Policies:
  - Unngå brede “FOR ALL” policies når det blir uklart; splitt til INSERT/UPDATE/DELETE der det gir bedre sikkerhet og revisjon.

G) FERDIG-DEFINISJON (FØR DU SIER “DONE”)
- Bygger uten feil (typecheck + build).
- Ingen secrets/PII i logs.
- RLS/policies verifisert for relevant endring.
- Norske UI-tekster der det er brukerflater.
- Unused imports/kode ryddet.
