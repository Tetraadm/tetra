---
name: supabase
description: Bruk denne for database-relaterte oppgaver: Supabase client setup, SQL queries, RLS policies, Storage, Realtime, og database typer. Inneholder best practices for Tetra DB.
---

## Når denne skill brukes

- Database queries og mutations
- Supabase client setup
- Storage operasjoner (fil-opplasting)
- Realtime subscriptions
- Database migrations
- Type-generering

---

## 1. Client Setup

### Browser Client (Client Components)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (Server Components, API Routes)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
}
```

### Admin Client (Service Role - Use Sparingly!)
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

// ⚠️ ONLY use for admin operations that bypass RLS
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

---

## 2. Type Definitions

### Generate Types
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Generate types from your project
supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Type Usage
```typescript
// types/database.ts (auto-generated, example structure)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'sikkerhetsadmin' | 'teamleder' | 'ansatt';
          company_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'sikkerhetsadmin' | 'teamleder' | 'ansatt';
          company_id?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: 'sikkerhetsadmin' | 'teamleder' | 'ansatt';
        };
      };
      documents: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          file_path: string;
          extracted_text: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<Row, 'id' | 'created_at'>;
        Update: Partial<Insert>;
      };
    };
  };
};

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Document = Database['public']['Tables']['documents']['Row'];
export type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
```

---

## 3. Common Query Patterns

### Fetch with Filtering
```typescript
// Get user's documents
const { data: documents, error } = await supabase
  .from('documents')
  .select('*')
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// Get specific document with related data
const { data: document } = await supabase
  .from('documents')
  .select(`
    *,
    created_by_profile:profiles!created_by(full_name, email)
  `)
  .eq('id', documentId)
  .single();

// Search documents
const { data: results } = await supabase
  .from('documents')
  .select('id, title, description')
  .ilike('title', `%${searchTerm}%`)
  .limit(10);

// Paginated fetch
const { data, count } = await supabase
  .from('documents')
  .select('*', { count: 'exact' })
  .range(page * pageSize, (page + 1) * pageSize - 1)
  .order('created_at', { ascending: false });
```

### Insert
```typescript
// Insert single
const { data, error } = await supabase
  .from('documents')
  .insert({
    company_id: companyId,
    title: 'Ny sikkerhetsinstruks',
    file_path: filePath,
    created_by: userId,
  })
  .select()
  .single();

// Insert multiple
const { data, error } = await supabase
  .from('documents')
  .insert([
    { title: 'Doc 1', ... },
    { title: 'Doc 2', ... },
  ])
  .select();
```

### Update
```typescript
// Update by ID
const { data, error } = await supabase
  .from('documents')
  .update({ 
    title: 'Oppdatert tittel',
    updated_at: new Date().toISOString()
  })
  .eq('id', documentId)
  .select()
  .single();

// Publish document
const { error } = await supabase
  .from('documents')
  .update({ 
    is_published: true,
    published_at: new Date().toISOString(),
    published_by: userId
  })
  .eq('id', documentId);
```

### Delete
```typescript
// Soft delete (recommended)
const { error } = await supabase
  .from('documents')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', documentId);

// Hard delete
const { error } = await supabase
  .from('documents')
  .delete()
  .eq('id', documentId);
```

---

## 4. Storage Operations

### Upload File
```typescript
// lib/storage/upload.ts
export async function uploadDocument(
  file: File,
  companyId: string
): Promise<{ path: string; error: Error | null }> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${companyId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { path: '', error };
  }

  return { path: data.path, error: null };
}
```

### Get Public URL
```typescript
export function getDocumentUrl(path: string): string {
  const supabase = createClient();
  
  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(path);
    
  return data.publicUrl;
}
```

### Get Signed URL (Private Files)
```typescript
export async function getSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600); // 1 hour expiry
    
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data.signedUrl;
}
```

### Delete File
```typescript
export async function deleteDocument(path: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);
    
  return !error;
}
```

---

## 5. Realtime Subscriptions

### Subscribe to Changes
```typescript
// hooks/useRealtimeDocuments.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Document } from '@/types/database';

export function useRealtimeDocuments(companyId: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    const fetchDocuments = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_published', true);
      
      if (data) setDocuments(data);
    };

    fetchDocuments();

    // Subscribe to changes
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments(prev => [payload.new as Document, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev => 
              prev.map(doc => 
                doc.id === payload.new.id ? payload.new as Document : doc
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => 
              prev.filter(doc => doc.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return documents;
}
```

---

## 6. Auth Helpers

### Get Current User
```typescript
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### Get User Profile
```typescript
export async function getUserProfile() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
}
```

### Magic Link Login
```typescript
export async function sendMagicLink(email: string) {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  
  return { error };
}
```

### Sign Out
```typescript
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
```

---

## 7. Error Handling

```typescript
// lib/supabase/errors.ts
export function handleSupabaseError(error: unknown): string {
  if (!error) return 'En ukjent feil oppstod';
  
  const pgError = error as { code?: string; message?: string };
  
  // Common Postgres/Supabase errors
  const errorMessages: Record<string, string> = {
    '23505': 'Denne oppføringen finnes allerede',
    '23503': 'Referert data finnes ikke',
    '42501': 'Du har ikke tilgang til denne ressursen',
    'PGRST116': 'Ingen data funnet',
    'PGRST301': 'For mange forespørsler',
  };
  
  return errorMessages[pgError.code || ''] || pgError.message || 'En feil oppstod';
}

// Usage
const { data, error } = await supabase.from('documents').select('*');

if (error) {
  const message = handleSupabaseError(error);
  toast.error(message);
  return;
}
```

---

## 8. Performance Tips

### Use Select Sparingly
```typescript
// ❌ Fetches all columns
const { data } = await supabase.from('documents').select('*');

// ✅ Only fetch needed columns
const { data } = await supabase
  .from('documents')
  .select('id, title, created_at');
```

### Use Count Efficiently
```typescript
// ❌ Fetches all rows just to count
const { data } = await supabase.from('documents').select('*');
const count = data?.length;

// ✅ Use count option
const { count } = await supabase
  .from('documents')
  .select('*', { count: 'exact', head: true });
```

### Batch Operations
```typescript
// ❌ Multiple requests
for (const doc of documents) {
  await supabase.from('documents').insert(doc);
}

// ✅ Single batch request
await supabase.from('documents').insert(documents);
```
