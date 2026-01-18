---
name: deployment
description: Bruk denne for deployment og DevOps: Vercel oppsett, Environment variables, CI/CD, og database migrations.
---

## Når denne skill brukes

- Deployment til Vercel
- Environment variables
- CI/CD pipeline
- Database migrations
- Monitoring og logging
- Performance optimalisering

---

## 1. Deployment Arkitektur

```
┌─────────────────────────────────────────────────────────┐
│                      GitHub                              │
│  main branch ──► Production (tetra.onl)                 │
│  develop branch ──► Staging (staging.tetra.onl)         │
│  PR branches ──► Preview (*.vercel.app)                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Vercel                              │
│  • Auto-deploy on push                                   │
│  • Preview deployments for PRs                          │
│  • Edge functions                                        │
│  • Analytics                                             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Supabase                             │
│  Production: separate project                            │
│  Staging: separate project (or same with different schema)│
└─────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables

### Vercel Environment Setup
```bash
# Production only
NEXT_PUBLIC_APP_URL=https://tetra.onl

# Staging only
NEXT_PUBLIC_APP_URL=https://staging.tetra.onl

# All environments
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

### .env.local (Development)
```env
# Supabase (Development/Staging project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Validation
```typescript
// lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }
  
  return result.data;
}

// Call in next.config.js or app initialization
```

---

## 3. Vercel Configuration

### vercel.json
```json
{
  "framework": "nextjs",
  "regions": ["arn1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ]
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for catching bugs
  reactStrictMode: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  
  // Experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
```

---

## 4. GitHub Actions CI/CD

### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## 5. Database Migrations

### Supabase CLI Setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Pull current schema
supabase db pull
```

### Creating Migrations
```bash
# Create new migration
supabase migration new add_category_to_documents

# Edit the migration file in supabase/migrations/

# Apply migration locally
supabase db reset

# Push to production
supabase db push
```

### Migration Example
```sql
-- supabase/migrations/20250116000000_add_category_to_documents.sql

-- Add category column
ALTER TABLE documents 
ADD COLUMN category TEXT;

-- Add category index for filtering
CREATE INDEX idx_documents_category ON documents(category);

-- Update RLS policy to include category filtering if needed
-- (existing policies still apply)
```

### Safe Migration Practices
```sql
-- ✅ Safe: Adding nullable column
ALTER TABLE documents ADD COLUMN category TEXT;

-- ✅ Safe: Adding column with default
ALTER TABLE documents ADD COLUMN priority INTEGER DEFAULT 0;

-- ⚠️ Careful: Adding NOT NULL requires backfill
ALTER TABLE documents ADD COLUMN required_field TEXT;
UPDATE documents SET required_field = 'default' WHERE required_field IS NULL;
ALTER TABLE documents ALTER COLUMN required_field SET NOT NULL;

-- ❌ Dangerous: Dropping column (data loss!)
-- Always use soft-delete approach first
```

---

## 6. Monitoring & Logging

### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Error Tracking (Sentry)
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Application Logging
```typescript
// lib/logger.ts
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
    console[level](JSON.stringify(entry));
  } else {
    console[level](`[${level.toUpperCase()}] ${message}`, data || '');
  }
}

// Usage
log('info', 'Document uploaded', { documentId: '123', userId: 'abc' });
log('error', 'Failed to process PDF', { error: error.message });
```

---

## 7. Performance Optimization

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Optimized
<Image
  src="/logo.png"
  alt="Tetra Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>

// ❌ Unoptimized
<img src="/logo.png" alt="Tetra Logo" />
```

### Dynamic Imports
```tsx
import dynamic from 'next/dynamic';

// Heavy component loaded only when needed
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false,
});
```

### Route Segment Config
```typescript
// app/admin/documents/page.tsx
export const dynamic = 'force-dynamic'; // Always fetch fresh data
export const revalidate = 0; // No caching

// app/public/page.tsx
export const revalidate = 3600; // Cache for 1 hour
```

---

## 8. Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied

### Post-deployment
- [ ] Verify site loads correctly
- [ ] Test critical user flows (login, document view)
- [ ] Check error tracking (Sentry)
- [ ] Verify API routes respond
- [ ] Check mobile responsiveness

### Rollback Plan
```bash
# Vercel instant rollback
# Go to Vercel Dashboard > Deployments > Previous deployment > Promote to Production

# Or via CLI
vercel rollback
```

---

## 9. Domain Configuration

### DNS Settings (tetra.onl)
```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### Vercel Domain Setup
```bash
# Add domain
vercel domains add tetra.onl

# Add staging subdomain
vercel domains add staging.tetra.onl
```
