<div align="center">

<img src="public/tetrivo-logo.png" alt="Tetrivo Logo" width="120" height="120">

# Tetrivo HMS

### Fremtidens plattform for trygghet på arbeidsplassen

**Moderne SaaS for HMS-arbeid med AI-assistent, dokumenthåndtering og lesebekreftelse**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🌐 tetrivo.com](https://tetrivo.com) • [📧 kontakt@tetrivo.com](mailto:kontakt@tetrivo.com)

</div>

---

## 🎯 Om Tetrivo

Tetrivo er en **moderne HMS-plattform** bygget for norske virksomheter. Vi samler internkontroll, dokumenthåndtering og compliance på ett sted – enkelt for de ansatte, oversiktlig for lederne.

### Hvorfor Tetrivo?

| 🤖 AI-Assistent | 📚 Digital Håndbok | ✅ Lesebekreftelse |
|-----------------|-------------------|-------------------|
| Still spørsmål om HMS-regler og få svar basert på bedriftens dokumenter | Alle instrukser og retningslinjer samlet med versjonskontroll | Sikre at ansatte har lest og forstått viktige dokumenter |

---

## ✨ Funksjoner

- **🤖 AI-Assistent** – Google Gemini for intelligent Q&A
- **📄 Dokumenthåndtering** – PDF-opplasting med tekstekstraksjon
- **✅ Lesebekreftelse** – Signeringslogg for alle instrukser
- **🔔 Varsling** – Automatiske varsler ved nye dokumenter
- **👥 Multi-tenant** – Full isolasjon med Row Level Security
- **📊 Audit Log** – GDPR-kompatibel aktivitetslogging

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 16.1, React 19 |
| **Språk** | TypeScript 5 |
| **Database** | PostgreSQL (Supabase) |
| **AI** | Google Gemini |
| **E-post** | Resend |
| **Hosting** | Vercel |
| **Rate Limiting** | Upstash Redis |
| **Error Tracking** | Sentry |

---

## 🚀 Kom i gang

### Forutsetninger

- Node.js 20+
- npm 10+
- [Supabase](https://supabase.com/) prosjekt
- [Google AI](https://ai.google.dev/) API-nøkkel

### Installasjon

```bash
# 1. Klon repositoriet
git clone https://github.com/Tetraadm/tetra.git
cd tetra

# 2. Installer avhengigheter
npm install

# 3. Konfigurer miljøvariabler
cp .env.example .env.local
# Rediger .env.local med dine nøkler

# 4. Start utviklingsserver
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔧 Miljøvariabler

### Påkrevde

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=https://tetrivo.com
```

### Valgfrie

| Variabel | Beskrivelse |
|----------|-------------|
| `RESEND_API_KEY` | E-postintegrasjon |
| `RESEND_FROM_EMAIL` | Avsenderadresse |
| `UPSTASH_REDIS_REST_URL` | Produksjons rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis token |

---

## 📁 Prosjektstruktur

```
tetrivo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/              # Admin dashboard
│   │   ├── leader/             # Teamleder dashboard
│   │   ├── employee/           # Ansatt dashboard
│   │   ├── api/                # API Routes
│   │   │   ├── ask/            # AI Q&A
│   │   │   ├── contact/        # Kontaktskjema
│   │   │   ├── upload/         # Filopplasting
│   │   │   └── invite/         # Invitasjoner
│   │   └── page.tsx            # Landing page
│   ├── components/             # React-komponenter
│   └── lib/                    # Utilities
├── supabase/sql/               # Database migrasjoner
└── tests/                      # E2E og unit tester
```

---

## 🌐 API

| Endepunkt | Metode | Beskrivelse |
|-----------|--------|-------------|
| `/api/ask` | POST | AI-drevet Q&A |
| `/api/contact` | POST | Kontaktskjema |
| `/api/upload` | POST | Filopplasting (Admin) |
| `/api/invite` | POST | Brukerinvitasjon (Admin) |
| `/api/confirm-read` | POST | Lesebekreftelse |
| `/api/health` | GET | Health check |

---

## 🗄️ Database

### Hovedtabeller

| Tabell | Beskrivelse |
|--------|-------------|
| `organizations` | Organisasjoner (tenants) |
| `profiles` | Brukerprofiler |
| `teams` | Team |
| `instructions` | HMS-dokumenter |
| `instruction_reads` | Lesebekreftelser |
| `audit_logs` | Aktivitetslogg |

### Roller

| Rolle | Rettigheter |
|-------|-------------|
| **Admin** | Full kontroll |
| **Teamleder** | Administrer eget team |
| **Ansatt** | Les instrukser, bruk AI |

---

## 🚀 Deployment

### Vercel (Anbefalt)

1. Push til GitHub
2. Importer i [Vercel](https://vercel.com)
3. Legg til miljøvariabler
4. Deploy ✅

**Produksjon:** [tetrivo.com](https://tetrivo.com)

---

## 🧪 Testing

```bash
# E2E-tester med Playwright
npx playwright install
npm run test:e2e
```

---

## 📝 Scripts

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run build` | Produksjonsbuild |
| `npm run lint` | Kjør ESLint |
| `npm run test:e2e` | Kjør E2E-tester |

---

## 📄 Lisens

Proprietær – © 2026 Tetrivo Systems

---

<div align="center">

**Bygget med ❤️ i Kristiansand, Norge**

[tetrivo.com](https://tetrivo.com) • [kontakt@tetrivo.com](mailto:kontakt@tetrivo.com) • [support@tetrivo.com](mailto:support@tetrivo.com)

</div>
