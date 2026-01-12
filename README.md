# Tetra - Digital HMS-plattform

Tetra er en digital sikkerhetsplattform for bedrifter som gjør HMS-arbeid enkelt og tilgjengelig.

## Teknologi

- **Frontend**: Next.js 16 med React 19 og TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Anthropic Claude 3.5 Haiku
- **Hosting**: Vercel

## Kjør lokalt

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Miljøvariabler

Opprett en `.env.local` fil med:

```
# Supabase (påkrevd)
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-nøkkel
SUPABASE_SERVICE_ROLE_KEY=din-service-role-nøkkel

# AI (påkrevd)
ANTHROPIC_API_KEY=din-anthropic-nøkkel

# Upstash Redis (valgfritt - bruker in-memory fallback hvis ikke satt)
UPSTASH_REDIS_REST_URL=din-upstash-url
UPSTASH_REDIS_REST_TOKEN=din-upstash-token

# Rate-limiting (valgfritt - defaults i parentes)
AI_RATE_LIMIT=20                # Maks AI-forespørsler per vindu (20)
AI_RATE_WINDOW_SECONDS=60       # Tidsvindu i sekunder (60)
UPLOAD_RATE_LIMIT=10            # Maks opplastinger per vindu (10)
UPLOAD_RATE_WINDOW_SECONDS=60   # Tidsvindu i sekunder (60)

# Opplasting (valgfritt)
MAX_UPLOAD_MB=10                # Maks filstørrelse i MB (10)

# AI-relevans (valgfritt)
AI_MIN_RELEVANCE_SCORE=0.35     # Minimumsrelevans for AI-svar (0.35)
```

## Deployment

Prosjektet er deployet på Vercel på [tetra.onl](https://tetra.onl)
