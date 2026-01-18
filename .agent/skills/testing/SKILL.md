---
name: testing
description: Bruk denne for testing: Unit tests (Vitest), Integration tests, E2E tests (Playwright), og test-oppsett.
---

## Når denne skill brukes

- Skrive unit tests
- Skrive integrasjonstester
- Skrive E2E tester
- Test-driven development (TDD)
- Debugging test failures

---

## 1. Test Stack

```
Unit/Integration:  Vitest + React Testing Library
E2E:               Playwright
Mocking:           MSW (Mock Service Worker)
Coverage:          Vitest coverage (c8)
```

---

## 2. Setup

### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### tests/setup.ts
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}));
```

---

## 3. Unit Test Patterns

### Testing React Components
```typescript
// components/admin/__tests__/DocumentCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentCard } from '../DocumentCard';

const mockDocument = {
  id: '1',
  title: 'Sikkerhetsinstruks',
  description: 'Generell sikkerhetsinstruks for ansatte',
  is_published: true,
  created_at: '2025-01-15T10:00:00Z',
};

describe('DocumentCard', () => {
  it('renders document title', () => {
    render(<DocumentCard document={mockDocument} onView={vi.fn()} />);
    
    expect(screen.getByText('Sikkerhetsinstruks')).toBeInTheDocument();
  });

  it('calls onView when clicked', () => {
    const onView = vi.fn();
    render(<DocumentCard document={mockDocument} onView={onView} />);
    
    fireEvent.click(screen.getByRole('article'));
    
    expect(onView).toHaveBeenCalledWith('1');
  });

  it('shows published badge when published', () => {
    render(<DocumentCard document={mockDocument} onView={vi.fn()} />);
    
    expect(screen.getByText('Publisert')).toBeInTheDocument();
  });

  it('shows draft badge when not published', () => {
    render(
      <DocumentCard 
        document={{ ...mockDocument, is_published: false }} 
        onView={vi.fn()} 
      />
    );
    
    expect(screen.getByText('Utkast')).toBeInTheDocument();
  });
});
```

### Testing Hooks
```typescript
// hooks/__tests__/useDocuments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDocuments } from '../useDocuments';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches documents on mount', async () => {
    const mockDocuments = [
      { id: '1', title: 'Doc 1' },
      { id: '2', title: 'Doc 2' },
    ];

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDocuments,
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useDocuments());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.error).toBeNull();
  });

  it('handles errors', async () => {
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useDocuments());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Database error');
    expect(result.current.documents).toEqual([]);
  });
});
```

### Testing Utilities
```typescript
// lib/utils/__tests__/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatFileSize } from '../formatters';

describe('formatDate', () => {
  it('formats date in Norwegian', () => {
    const date = new Date('2025-01-15T10:00:00Z');
    expect(formatDate(date)).toBe('15. januar 2025');
  });

  it('handles invalid date', () => {
    expect(formatDate(new Date('invalid'))).toBe('Ugyldig dato');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
```

---

## 4. Integration Test Patterns

### Testing API Routes
```typescript
// app/api/documents/__tests__/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Documents API', () => {
  describe('GET /api/documents', () => {
    it('returns 401 when not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: null }, 
            error: null 
          }),
        },
      } as any);

      const request = new NextRequest('http://localhost/api/documents');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('returns documents for authenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      
      const mockDocuments = [{ id: '1', title: 'Test' }];
      
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockDocuments,
              error: null,
            }),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost/api/documents');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toEqual(mockDocuments);
    });
  });
});
```

---

## 5. E2E Test Patterns (Playwright)

### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /logg inn/i })).toBeVisible();
  });

  test('allows magic link login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/sjekk e-posten din/i)).toBeVisible();
  });
});

// tests/e2e/documents.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Documents (Authenticated)', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test('admin can view documents', async ({ page }) => {
    await page.goto('/admin/dokumenter');
    
    await expect(page.getByRole('heading', { name: /dokumenter/i })).toBeVisible();
  });

  test('admin can upload document', async ({ page }) => {
    await page.goto('/admin/dokumenter');
    
    // Click upload button
    await page.click('button:has-text("Last opp")');
    
    // Fill form
    await page.fill('input[name="title"]', 'Test Dokument');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test.pdf');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.getByText(/dokument lastet opp/i)).toBeVisible();
  });
});
```

---

## 6. Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test -- DocumentCard.test.tsx

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E in UI mode
npm run test:e2e:ui
```

---

## 7. Test Priorities for Tetra

### Kritisk (må ha)
- [ ] Auth flow (login, logout, session)
- [ ] RLS policies (users can only see their company's data)
- [ ] Audit logging (all sensitive actions logged)
- [ ] AI input sanitization

### Høy prioritet
- [ ] Document CRUD operations
- [ ] File upload/download
- [ ] Role-based access control
- [ ] API error handling

### Medium prioritet
- [ ] UI components with business logic
- [ ] Form validation
- [ ] Search functionality

### Lav prioritet
- [ ] Pure presentational components
- [ ] Styling/layout
