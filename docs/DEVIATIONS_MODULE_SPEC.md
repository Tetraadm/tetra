# Avviksrapportering Modul - Utviklingsguide

**For:** Tetrivo HMS plattformen  
**Dato:** 2026-01-21  
**Versjon:** 1.0

---

## 📋 Oversikt

Du skal bygge en **avviksrapporteringsmodul** som integreres i den eksisterende Tetrivo HMS-plattformen. Når du er ferdig, skal koden kunne "limes inn" direkte i prosjektet uten konflikter.

---

## 🏗️ Arkitektur

### Eksisterende Struktur (ikke endre)

```
src/app/
├── (public)/              # Offentlige sider (landing, login)
├── (platform)/            # Autentiserte sider
│   ├── portal/            # App-velger
│   ├── instructions/      # HMS-instrukser (eksisterer)
│   └── deviations/        # ← DIN MODUL HER
```

### Din Modul Struktur

```
src/app/(platform)/deviations/
├── page.tsx               # Entry point (laster riktig dashboard)
├── admin/                 # Admin dashboard
│   ├── AdminDashboard.tsx
│   ├── components/
│   └── tabs/
├── employee/              # Ansatt visning
│   ├── EmployeeApp.tsx
│   └── components/
└── leader/                # Teamleder visning (optional)
    └── LeaderDashboard.tsx
```

---

## 🗄️ Database Schema

### Nye Tabeller

```sql
-- Avvik/hendelser
CREATE TABLE deviations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  
  -- Klassifisering
  category TEXT NOT NULL CHECK (category IN (
    'hms', 'kvalitet', 'miljø', 'sikkerhet', 'annet'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN (
    'low', 'medium', 'high', 'critical'
  )),
  
  -- Innhold
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'resolved', 'closed'
  )),
  
  -- Behandling
  assigned_to UUID REFERENCES profiles(id),
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vedlegg til avvik
CREATE TABLE deviation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kommentarer/historikk
CREATE TABLE deviation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_id UUID NOT NULL REFERENCES deviations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Bare synlig for admin/leder
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indekser
CREATE INDEX idx_deviations_org_id ON deviations(org_id);
CREATE INDEX idx_deviations_status ON deviations(status);
CREATE INDEX idx_deviations_reported_by ON deviations(reported_by);
CREATE INDEX idx_deviation_comments_deviation_id ON deviation_comments(deviation_id);
```

### RLS Policies (KRITISK!)

```sql
-- Aktiver RLS
ALTER TABLE deviations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deviation_comments ENABLE ROW LEVEL SECURITY;

-- Deviations policies
CREATE POLICY "Users can view deviations in own org"
  ON deviations FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create deviations in own org"
  ON deviations FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admin/leader can update deviations"
  ON deviations FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'teamleder')
      OR reported_by = auth.uid()
    )
  );

-- Lignende for attachments og comments...
```

---

## 🔌 API Endpoints

### Plassering
```
src/app/api/deviations/
├── route.ts           # GET (list), POST (create)
├── [id]/
│   ├── route.ts       # GET, PATCH, DELETE
│   ├── comments/
│   │   └── route.ts   # GET, POST
│   └── attachments/
│       └── route.ts   # POST
└── stats/
    └── route.ts       # Dashboard statistikk
```

### Eksempel API Response

```typescript
// GET /api/deviations
{
  "data": [
    {
      "id": "uuid",
      "title": "Manglende verneutstyr",
      "category": "hms",
      "severity": "high",
      "status": "open",
      "reported_by": { "id": "uuid", "full_name": "Ola Nordmann" },
      "created_at": "2026-01-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 45
  }
}
```

---

## 🎨 UI Komponenter

### Bruk Eksisterende

```typescript
// Disse finnes allerede - BRUK DEM
import { Button } from '@/components/ui/button'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
```

### Styling

- **Tailwind CSS** - Følg eksisterende patterns
- **Dark mode** - Bruk `dark:` prefix
- **CSS variabler** - `bg-background`, `text-foreground`, `border`
- **Ikoner** - lucide-react

### Eksempel Komponent

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeviationCardProps {
  deviation: Deviation
  onView: (id: string) => void
}

export function DeviationCard({ deviation, onView }: DeviationCardProps) {
  return (
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 ${
          deviation.severity === 'critical' ? 'text-red-500' :
          deviation.severity === 'high' ? 'text-orange-500' :
          'text-yellow-500'
        }`} />
        <div className="flex-1">
          <h3 className="font-medium">{deviation.title}</h3>
          <p className="text-sm text-muted-foreground">{deviation.category}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onView(deviation.id)}>
          Vis
        </Button>
      </div>
    </div>
  )
}
```

---

## 🔐 Sikkerhetskrav

### Må Følges

1. **RLS på alle tabeller** - Ingen unntak
2. **Server-side auth** - Aldri stol på client-side
3. **Validering med Zod** - På alle API inputs
4. **Sanitering** - XSS-prevention på user input
5. **Rate limiting** - Bruk eksisterende `getRateLimiter()`

### Eksempel API med Auth

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { getRateLimiter } from '@/lib/ratelimit'
import { z } from 'zod'

const createDeviationSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['hms', 'kvalitet', 'miljø', 'sikkerhet', 'annet']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

export async function POST(request: Request) {
  const supabase = await createServerClient()
  
  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Rate limit
  const limiter = getRateLimiter('api')
  const { success } = await limiter.limit(user.id)
  if (!success) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }
  
  // Validate
  const body = await request.json()
  const result = createDeviationSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }
  
  // Get user profile for org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  
  // Create deviation
  const { data, error } = await supabase
    .from('deviations')
    .insert({
      ...result.data,
      org_id: profile.org_id,
      reported_by: user.id,
    })
    .select()
    .single()
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json({ data })
}
```

---

## 📁 Fil-leveranse

### Mapper å levere

```
deviations-module/
├── src/
│   ├── app/
│   │   ├── (platform)/deviations/     # Hele modulen
│   │   └── api/deviations/            # API routes
│   ├── components/deviations/         # Delte komponenter
│   └── lib/types/deviations.ts        # TypeScript types
├── supabase/
│   └── sql/consolidated/
│       └── 12_deviations.sql          # Database migration
└── tests/
    └── unit/api/deviations.test.ts    # Tester
```

### Navnekonvensjoner

- Filer: `kebab-case.ts`
- Komponenter: `PascalCase.tsx`
- Funksjoner: `camelCase`
- Database: `snake_case`

---

## ✅ Sjekkliste Før Levering

```
[ ] Alle tabeller har RLS aktivert
[ ] Alle API routes har auth check
[ ] Zod validering på alle inputs
[ ] TypeScript - ingen `any` (bruk `unknown` hvis nødvendig)
[ ] Lint passerer: `npm run lint`
[ ] TypeCheck passerer: `npm run typecheck`
[ ] Tester passerer: `npm run test`
[ ] Dark mode fungerer
[ ] Responsivt design (mobil + desktop)
[ ] Norsk bokmål i all UI-tekst
```

---

## 🧪 Testing

### Kjør lokalt

```bash
# Installer dependencies
npm install

# Kjør dev server
npm run dev

# Kvalitetssjekk
npm run lint
npm run typecheck
npm run test
```

### Test Cases å dekke

1. Opprette avvik (alle kategorier/severity)
2. Liste avvik (filtrering, paginering)
3. Oppdatere status
4. Legge til kommentar
5. Laste opp vedlegg
6. Slette avvik (kun admin)
7. RLS isolation (bruker A ser ikke bruker B sin org)

---

## 📞 Kontakt

Ved spørsmål om eksisterende kodebase eller integrasjon, kontakt prosjekteier.

**Lykke til!** 🚀
