---
name: security
description: Bruk denne for sikkerhets- og compliance-oppgaver: RLS, Autentisering, Audit Logging, GDPR, og sikring av API-er.
---

## Når denne skill brukes

- Sikkerhetsgjennomgang av kode
- Implementere/oppdatere RLS policies
- Auth-flyt og session-håndtering
- Audit logging implementasjon
- AI prompt injection beskyttelse
- GDPR/personvern compliance

---

## Sikkerhetsarkitektur

### 1. Autentisering (Supabase Auth)

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### 2. Autorisasjon (Role-based)

```typescript
// lib/auth/checkRole.ts
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type UserRole = 'sikkerhetsadmin' | 'teamleder' | 'ansatt';

export async function requireRole(allowedRoles: UserRole[]) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as UserRole)) {
    redirect('/unauthorized');
  }

  return { user, role: profile.role as UserRole };
}

// Bruk i server components/actions:
// const { user, role } = await requireRole(['sikkerhetsadmin', 'teamleder']);
```

### 3. RLS Policies Template

```sql
-- =====================================================
-- STANDARD RLS PATTERN FOR TETRA
-- =====================================================

-- Enable RLS
ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;

-- Helper function: Get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- DOCUMENTS TABLE POLICIES
-- =====================================================

-- SELECT: Users see their company's published docs
CREATE POLICY "documents_select_company"
ON documents FOR SELECT
USING (
  company_id = get_user_company_id()
  AND (
    is_published = true
    OR get_user_role() IN ('sikkerhetsadmin', 'teamleder')
  )
);

-- INSERT: Only admins can upload
CREATE POLICY "documents_insert_admin"
ON documents FOR INSERT
WITH CHECK (
  company_id = get_user_company_id()
  AND get_user_role() = 'sikkerhetsadmin'
);

-- UPDATE: Only admins can edit
CREATE POLICY "documents_update_admin"
ON documents FOR UPDATE
USING (
  company_id = get_user_company_id()
  AND get_user_role() = 'sikkerhetsadmin'
)
WITH CHECK (
  company_id = get_user_company_id()
  AND get_user_role() = 'sikkerhetsadmin'
);

-- DELETE: Only admins can delete
CREATE POLICY "documents_delete_admin"
ON documents FOR DELETE
USING (
  company_id = get_user_company_id()
  AND get_user_role() = 'sikkerhetsadmin'
);

-- =====================================================
-- AUDIT LOG POLICIES (IMMUTABLE)
-- =====================================================

-- INSERT: Any authenticated user (via service role in app)
CREATE POLICY "audit_insert_authenticated"
ON audit_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: Only admins can view audit logs
CREATE POLICY "audit_select_admin"
ON audit_log FOR SELECT
USING (
  company_id = get_user_company_id()
  AND get_user_role() = 'sikkerhetsadmin'
);

-- NO UPDATE OR DELETE POLICIES (audit logs are immutable)
```

---

## 4. Audit Logging

```typescript
// lib/audit/logger.ts
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

interface AuditEntry {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export async function auditLog(entry: AuditEntry) {
  const supabase = await createClient();
  const headersList = await headers();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Audit log failed: No authenticated user');
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  await supabase.from('audit_log').insert({
    user_id: user.id,
    company_id: profile?.company_id,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    metadata: entry.metadata,
    ip_address: headersList.get('x-forwarded-for')?.split(',')[0] || null,
    user_agent: headersList.get('user-agent'),
  });
}

// Standard audit actions
export const AUDIT_ACTIONS = {
  // Auth
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  
  // Documents
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_PUBLISH: 'document.publish',
  
  // AI
  AI_QUERY: 'ai.query',
  
  // Admin
  USER_CREATE: 'admin.user_create',
  USER_UPDATE: 'admin.user_update',
  SETTINGS_CHANGE: 'admin.settings_change',
} as const;
```

---

## 5. AI Security (Spør Tetra)

### Prompt Injection Protection

```typescript
// lib/ai/sanitize.ts

// Patterns that could indicate injection attempts
const INJECTION_PATTERNS = [
  /system\s*:/gi,
  /assistant\s*:/gi,
  /human\s*:/gi,
  /user\s*:/gi,
  /ignore\s+(previous|all|above)/gi,
  /disregard\s+(previous|all|above)/gi,
  /forget\s+(everything|all|previous)/gi,
  /new\s+instructions?/gi,
  /override/gi,
  /jailbreak/gi,
  /<\/?[a-z]+>/gi,  // HTML tags
  /\{\{.*\}\}/g,    // Template syntax
];

export function sanitizeUserInput(input: string): string {
  let sanitized = input;
  
  // Remove potential injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }
  
  // Limit length
  sanitized = sanitized.slice(0, 2000);
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

export function detectInjectionAttempt(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}
```

### System Prompt Structure

```typescript
// lib/ai/systemPrompt.ts

export function buildSystemPrompt(documents: Document[]): string {
  const documentContext = documents
    .map(doc => `
---
DOKUMENT: ${doc.title}
KATEGORI: ${doc.category || 'Generelt'}
INNHOLD:
${doc.extracted_text?.slice(0, 5000) || 'Ingen tekstinnhold tilgjengelig'}
---
    `)
    .join('\n');

  return `
Du er Tetra, en HMS-assistent for norske bedrifter.

## UFRAVIKELIGE REGLER

1. **Kun dokumentbaserte svar**: Du skal KUN svare basert på dokumentene nedenfor.
2. **Innrøm begrensninger**: Hvis informasjonen ikke finnes i dokumentene, si:
   "Dette finner jeg ikke i bedriftens HMS-dokumenter. Kontakt din HMS-ansvarlig for mer informasjon."
3. **Ingen eksterne kilder**: Aldri referer til informasjon utenfor de oppgitte dokumentene.
4. **Ingen farlige råd**: Aldri gi medisinsk, juridisk eller økonomisk rådgivning.
5. **Nødsituasjoner**: Ved akutte situasjoner, henvis ALLTID til:
   - Medisinsk nød: 113
   - Brann: 110
   - Politi: 112
6. **Språk**: Svar alltid på norsk (bokmål).

## TILGJENGELIGE DOKUMENTER

${documentContext}

## SVARFORMAT

- Vær konsis og presis
- Referer til spesifikke dokumenter når relevant
- Bruk punktlister for flere elementer
- Avslutt med oppfølgingsspørsmål hvis relevant
`;
}
```

---

## 6. API Route Security

```typescript
// app/api/documents/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AUDIT_ACTIONS } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Ikke autentisert' },
        { status: 401 }
      );
    }

    // 2. Get user profile with role (RLS handles company filtering)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Bruker ikke funnet' },
        { status: 404 }
      );
    }

    // 3. Fetch documents (RLS filters automatically)
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Kunne ikke hente dokumenter' },
        { status: 500 }
      );
    }

    // 4. Audit log the access
    await auditLog({
      action: AUDIT_ACTIONS.DOCUMENT_VIEW,
      metadata: { documentCount: documents?.length || 0 }
    });

    return NextResponse.json({ documents });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
}
```

---

## 7. Security Checklist

### Før Deploy
- [ ] Alle API routes har auth-sjekk
- [ ] RLS aktivert på alle tabeller
- [ ] RLS policies testet med forskjellige roller
- [ ] Audit logging på sensitive operasjoner
- [ ] Input sanitering på bruker-input
- [ ] Error messages avslører ikke sensitiv info
- [ ] Environment variables ikke eksponert til client

### AI Sikkerhet
- [ ] System prompt er robust mot injection
- [ ] Bruker-input saniteres før AI-kall
- [ ] AI-svar logges i audit_log
- [ ] Dokumentkontekst begrenses til brukerens bedrift
- [ ] Rate limiting på AI-endepunkt

### GDPR/Personvern
- [ ] Brukerdata kan eksporteres
- [ ] Brukerdata kan slettes (soft delete først)
- [ ] Samtykke dokumentert for AI-bruk
- [ ] Ingen unødvendig lagring av persondata

---

## 8. Vanlige Sårbarheter å Sjekke

| Sårbarhet | Sjekk | Løsning |
|-----------|-------|---------|
| SQL Injection | Raw SQL queries | Bruk Supabase SDK |
| XSS | User-generated content | React escaper automatisk |
| CSRF | State-changing requests | Supabase håndterer |
| Auth bypass | Direct URL access | Middleware + RLS |
| Data leakage | API responses | RLS + response filtering |
| Prompt injection | AI queries | Input sanitering |
| Privilege escalation | Role changes | Server-side validation |
