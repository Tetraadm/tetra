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
NEXT_PUBLIC_SUPABASE_URL=din-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din-supabase-nøkkel
SUPABASE_SERVICE_ROLE_KEY=din-service-role-nøkkel
ANTHROPIC_API_KEY=din-anthropic-nøkkel
```

## Deployment

Prosjektet er deployet på Vercel på [tetra.onl](https://tetra.onl)
