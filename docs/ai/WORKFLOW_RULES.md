# AI Workflow Rules (Claude + Codex)

Dette dokumentet beskriver hvordan Claude (VS Code) og Codex (terminal) samarbeider uten å gå hverandre i beina.

## Roller

### Claude (VS Code) = Arkitekt + kirurg
- Store/strukturelle kodeendringer på tvers av filer
- Arkitektur, komponentstruktur, API-design, Supabase/RLS-strategi
- UI/UX modernisering og konsistens
- Skriver planer, foreslår endringer, gjør gjennomtenkte refactors

### Codex (Terminal) = Mekaniker + testpilot
- Kjører kommandoer, finner feil, verifiserer fixes
- Lint/typecheck/build/test
- Repo-søk (rg), små codemods, opprydding, formatering
- Rapporterer konkret: "kommando → resultat → hva feilet → hvor"

## Absolutte regler (Non-negotiables)
- Ingen secrets i git. Ikke skriv nøkler i repo.
- Ikke introduser nye dependencies uten tydelig begrunnelse.
- Endringer i små steg, alltid verifiserbare.
- Alt viktig logges: session-logg + handoff + TODO.
- Ved usikkerhet rundt sikkerhet/RLS: stopp og eskaler med tydelig risiko.

## Mandatory read order (hver sesjon, før arbeid)
Begge agentene MÅ lese i denne rekkefølgen:
1) `PROJECT_CONTEXT.md` 
2) `WORKFLOW_RULES.md` 
3) `TODO_NEXT.md` 
4) `HANDOFF.md` 
5) Siste sesjon i `SESSION_LOG.md` 

## Handoff-protokoll (kritisk)

### Single source of truth
- `HANDOFF.md` er fasiten for hva den andre agenten forventer.

### Claude må:
- Starte med å lese "Codex -> Claude" i `HANDOFF.md` (hvis den er nyere enn siste Claude-oppføring).
- Avslutte arbeidet med å oppdatere "Claude -> Codex" i `HANDOFF.md`:
  - commands Codex skal kjøre
  - forventet resultat
  - hvor/hvordan feilsøke
  - hvilke filer som ble endret
- Logge i `SESSION_LOG.md` og oppdatere `TODO_NEXT.md`.

### Codex må:
- Starte med å lese "Claude -> Codex" i `HANDOFF.md` (hvis den er nyere enn siste Codex-oppføring).
- Avslutte arbeidet med å oppdatere "Codex -> Claude" i `HANDOFF.md`:
  - hva ble kjørt (kommandoer + resultat)
  - hva feilet og nøyaktig error
  - hva ble fikset (filer)
  - hva Claude bør gjøre videre
- Logge i `SESSION_LOG.md` og oppdatere `TODO_NEXT.md`.

## Standard verifikasjon (Codex)
Kjør dette (tilpass etter package.json):
- `git status` 
- `git diff` 
- `npm run lint` 
- `npm run typecheck` (eller `tsc -p .`)
- `npm run build` 
- `npm test` (hvis finnes)

## Definition of Done (per oppgave)
- Kode endret (hvis relevant)
- Verifisert (lint/type/build)
- `HANDOFF.md` oppdatert
- `SESSION_LOG.md` appendet
- `TODO_NEXT.md` oppdatert
- Eventuelle viktige valg inn i `DECISIONS.md`
