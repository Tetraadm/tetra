---
name: overview
description: Oversikt over alle tilgjengelige skills og workflows i Tetra-prosjektet. Referer til denne for å vite hvilken AI-modell som passer best.
---

## 📋 Quick Reference

| Jeg trenger hjelp med... | Skill | Anbefalt modell |
|--------------------------|-------|-----------------|
| UI-design, komponenter | [Frontend Design](../frontend-design/SKILL.md) | Gemini 3 Pro |
| Sikkerhet, RLS, auth | [Security](../security/SKILL.md) | Claude Opus 4.5 |
| Database, queries | [Supabase](../supabase/SKILL.md) | Claude Sonnet 4.5 |
| Spør Tetra AI | [AI Integration](../ai-integration/SKILL.md) | Claude Opus 4.5 |
| Testing | [Testing](../testing/SKILL.md) | Claude Sonnet 4.5 |
| Deployment | [Deployment](../deployment/SKILL.md) | Claude Sonnet 4.5 |

---

## 📁 Filstruktur

```
tetra-docs/
├── TETRA_GLOBAL_RULES.md          # ⭐ START HER - Les denne først!
├── SKILLS_INDEX.md                 # Denne filen
└── skills/
    ├── frontend-design/SKILL.md   # UI/UX, komponenter, styling
    ├── security/SKILL.md          # Auth, RLS, audit, AI-sikkerhet
    ├── supabase/SKILL.md          # Database, storage, realtime
    ├── ai-integration/SKILL.md    # Spør Tetra, Claude API
    ├── testing/SKILL.md           # Unit, integration, E2E
    └── deployment/SKILL.md        # Vercel, CI/CD, migrations
```

---

## 🤖 AI-modell Hurtigguide

### Claude Opus 4.5 — Bruk for:
- Arkitektur og design-beslutninger
- Sikkerhetsgjennomgang
- Kompleks feilsøking
- Prompt engineering for "Spør Tetra"
- Code review av kritiske komponenter

### Claude Sonnet 4.5 — Bruk for:
- Daglig feature-utvikling
- Bug fixes
- Supabase-integrasjon
- Testing
- Dokumentasjon

### Claude Haiku 4.5 — Bruk for:
- Raske spørsmål
- Enkle snippets
- Oversettelser
- Boilerplate-generering

### Gemini 3 Pro — Bruk for:
- UI-prototyping og "vibe coding"
- Analyse av skjermbilder/design
- Kreative UI-løsninger
- Second opinion på arkitektur
- Long-context analyse av codebase

### Gemini 3 Flash — Bruk for:
- Ultra-rask iterasjon
- Quick mockups
- Bulk-generering av varianter

---

## 🚀 Vanlige Workflows

### Ny Feature
```
1. Les TETRA_GLOBAL_RULES.md for kontekst
2. Les relevant skill (f.eks. SKILL_FRONTEND_DESIGN.md)
3. Bruk Claude Sonnet for implementering
4. Bruk Gemini 3 Pro for UI-polish
5. Bruk Claude Sonnet for testing
```

### Sikkerhetsforbedring
```
1. Les SKILL_SECURITY.md
2. Bruk Claude Opus for analyse
3. Bruk Claude Sonnet for implementering
4. Bruk Opus for review
```

### Database-endring
```
1. Les SKILL_SUPABASE.md
2. Design schema med Claude Opus
3. Skriv migration
4. Test RLS policies
5. Deploy via SKILL_DEPLOYMENT.md
```

### UI-redesign
```
1. Les SKILL_FRONTEND_DESIGN.md
2. Bruk Gemini 3 Pro for prototyping
3. Bruk Claude Sonnet for implementering
4. Test på mobile og desktop
```

---

## 💡 Pro Tips

### For nye AI-chats
```
Start alltid med:
"Les TETRA_GLOBAL_RULES.md og [relevant skill] før du begynner."
```

### For komplekse problemer
```
"Bruk Opus for dette" eller "Få second opinion fra Gemini"
```

### For rask iterasjon
```
"Quick fix" eller "Bare en liten endring"
→ Bruker Haiku eller Flash automatisk
```

---

## 📞 Trigger-fraser

| Frase | Handling |
|-------|----------|
| "Bruk Opus for dette" | Bruker Claude Opus 4.5 |
| "Bruk Gemini for dette" | Bruker Gemini 3 Pro |
| "Raskt spørsmål" | Bruker Claude Haiku |
| "Second opinion" | Sammenligner Claude og Gemini |
| "Sikkerhetsgjennomgang" | Les SKILL_SECURITY.md + Opus |
| "Trenger UI-hjelp" | Les SKILL_FRONTEND_DESIGN.md + Gemini |

---

## ✅ Før du committer

- [ ] Koden følger standardene i TETRA_GLOBAL_RULES.md
- [ ] Alle tekster er på norsk
- [ ] TypeScript kompilerer uten feil
- [ ] Tester er skrevet og passerer
- [ ] Sikkerhetskrav er fulgt (RLS, audit logging)

---

*Opprettet for Tetra HMS Platform av Simen*
