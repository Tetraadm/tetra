# AI Workspace (Claude + Codex)

Dette er "minnet" til Tetra-prosjektet. Målet er:
- Null dobbeltarbeid
- All viktig info overlever nye chat-sesjoner
- Claude og Codex leser og skriver handoff til hverandre hver gang

## Quick start (hver sesjon)
1) Les `PROJECT_CONTEXT.md` 
2) Les `WORKFLOW_RULES.md` 
3) Les `TODO_NEXT.md` 
4) Les `HANDOFF.md` 
5) Sjekk siste blokk i `SESSION_LOG.md` 

## Hvor ting skal skrives
- Nyeste handoff mellom agentene: `HANDOFF.md` (oppdateres hver gang)
- Fortløpende logg (append-only): `SESSION_LOG.md` 
- Neste steg: `TODO_NEXT.md` 
- Viktige "vi valgte X fordi Y": `DECISIONS.md` 

## Regel
Hvis `HANDOFF.md` ikke er oppdatert etter en sesjon, så "telles ikke" sesjonen. 🙂

## Session prompts (copy/paste)
- Se `SESSION_PROMPTS.md`
