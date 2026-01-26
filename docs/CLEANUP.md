# Prosjekt Opprydding

**Dato:** 2026-01-26

---

## 🗑️ Trygt å Slette

### Tomme/Genererte mapper
| Path | Grunn | Størrelse |
|------|-------|-----------|
| `demo.ui/` | Tom mappe, ingen innhold | 0 KB |
| `playwright-report/` | Generert rapport, i .gitignore | ~520 KB |
| `test-results/` | Generert, i .gitignore | < 1 KB |
| `.next/` | Build cache, i .gitignore | Varierer |
| `tsconfig.tsbuildinfo` | TS cache, i .gitignore | ~350 KB |

### Gamle logo-scripts (vurder)
| Path | Grunn |
|------|-------|
| `scripts/apply_gradient_logo.js` | Engangs logo-script |
| `scripts/polish_logo.js` | Engangs logo-script |
| `scripts/recolor_logo.js` | Engangs logo-script |
| `scripts/recolor_png.js` | Engangs logo-script |
| `scripts/svg_to_brand.js` | Engangs logo-script |

> **Merk:** Behold `scripts/backfill-embeddings.ts` – dette brukes for RAG.

### Dokumenter (vurder konsolidering)
| Path | Grunn |
|------|-------|
| `docs/Audit codebase thoroughly.docx` | Gammelt Word-dokument, erstattet av .md filer |
| `docs/deepdive_audit.md` | Gammel audit, mulig duplikat |

---

## ✅ Behold

| Path | Grunn |
|------|-------|
| `.agent/` | Agent config (i .gitignore, men nyttig lokalt) |
| `.cursorrules` | Cursor IDE config |
| `.github/` | CI/CD workflows |
| `docs/IMPROVEMENT_PLAN.md` | Aktiv planlegging |
| `docs/PILOT_READINESS_AUDIT.md` | Referansedokument |
| `docs/HVORDAN_TETRIVO_FUNGERER.md` | Dokumentasjon |
| `docs/SIKKERHET_OG_FUNKSJONALITET.md` | Sikkerhetsdok |
| `docs/full_plangpt_forslag.md` | GPT-analyse (referanse) |
| `scripts/backfill-embeddings.ts` | RAG-verktøy |
| `supabase/sql/` | Database migrasjoner |
| `tests/` | Unit og RLS tester |
| `src/` | Applikasjonskode |

---

## 📁 Mappestruktur Vurdering

### Nåværende struktur
```
tetra/
├── .agent/          # AI agent config
├── .github/         # CI/CD
├── docs/            # Dokumentasjon
├── public/          # Statiske filer
├── scripts/         # CLI verktøy
├── src/
│   ├── app/         # Next.js App Router
│   │   ├── (platform)/   # Beskyttede routes
│   │   ├── (public)/     # Offentlige sider
│   │   └── api/          # API routes
│   ├── components/  # React komponenter
│   └── lib/         # Utility biblioteker
├── supabase/sql/    # DB migrasjoner
└── tests/           # Tester
```

### Vurdering: ✅ STRUKTUR ER GOD

**Fordeler:**
- Standard Next.js 14+ App Router konvensjon
- Tydelig skille: `(platform)` vs `(public)` route groups
- Logisk organisering av `lib/`, `components/`, `api/`
- Supabase SQL i egen mappe med `consolidated/` og `seed/`

**Ingen endringer nødvendig.** Strukturen følger best practices.

---

## 🛠️ Oppryddingskommandoer

```powershell
# Slett tomme/genererte mapper
Remove-Item -Recurse -Force demo.ui
Remove-Item -Recurse -Force playwright-report
Remove-Item -Recurse -Force test-results
Remove-Item -Force tsconfig.tsbuildinfo

# Slett gamle logo-scripts (valgfritt)
Remove-Item scripts/apply_gradient_logo.js
Remove-Item scripts/polish_logo.js
Remove-Item scripts/recolor_logo.js
Remove-Item scripts/recolor_png.js
Remove-Item scripts/svg_to_brand.js

# Slett gammel docx
Remove-Item "docs/Audit codebase thoroughly.docx"
```

---

## Oppsummering

| Kategori | Antall | Handling |
|----------|--------|----------|
| Tomme mapper | 1 | Slett |
| Genererte filer | 3 | Slett (regenereres) |
| Logo-scripts | 5 | Vurder sletting |
| Gamle docs | 1-2 | Vurder sletting |
| **Total frigjort** | | ~1 MB + |

**Mappestruktur:** ✅ Ingen endringer nødvendig
