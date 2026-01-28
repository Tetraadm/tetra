# Tetrivo HMS Platform - Google Cloud Integration

**Date**: January 2025 (Updated: January 28, 2026)  
**Status**: Production Ready

---

## Overview

This document captures the complete Google Cloud integration for the Tetrivo HMS platform. 

**All Google Cloud APIs are called via Supabase Edge Functions** to avoid Turbopack compatibility issues.

The system uses:
- **Vertex AI Embeddings** (768 dimensions) for semantic search
- **Vertex AI Search** for hybrid search with grounding
- **Google Document AI** for PDF text extraction (OCR)
- **Gemini 2.0 Flash** for AI-powered answers
- **Supabase Edge Functions** for all Google Cloud API calls

---

## Architecture

```
                    +---------------------------+
                    |      Next.js App          |
                    | (Vercel / Turbopack)      |
                    +---------------------------+
                               |
         +---------------------+---------------------+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
| /api/upload      |  | /api/ask         |  | Admin Dashboard  |
+------------------+  +------------------+  +------------------+
         |                     |                     |
         v                     v                     v
+========================================================+
|              Supabase Edge Functions                    |
|  (Deno runtime - Google Cloud SDK compatible)          |
+========================================================+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
| process-document |  | gemini-chat      |  | vertex-search    |
| (Document AI)    |  | (Gemini 2.0)     |  | (Discovery Eng.) |
+------------------+  +------------------+  +------------------+
         |                     |                     |
         v                     v                     v
+------------------+  +------------------+  +------------------+
| generate-embed.  |  | Generates AI     |  | vertex-admin     |
| (Vertex AI)      |  | responses        |  | (Data Store mgmt)|
+------------------+  +------------------+  +------------------+
         |
         v
+------------------+
| Supabase DB      |
| (768-dim vectors)|
+------------------+
```

### Why Edge Functions?
Google Cloud SDKs (`@google-cloud/*`) don't work with Next.js Turbopack.
All Google APIs are called via Supabase Edge Functions using HTTP REST APIs directly.

---

## 1. Embedding System

### Provider: Vertex AI (Exclusive)
- **Model**: `text-multilingual-embedding-002`
- **Dimensions**: 768 (migrated from OpenAI's 1536)
- **Location**: `europe-west4`

### Database Schema
```sql
-- Both tables use 768-dimension vectors
ALTER TABLE instructions ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE instruction_chunks ALTER COLUMN embedding TYPE vector(768);
```

### Files
- `src/lib/embeddings.ts` - Vertex AI embeddings via HTTP API
- `supabase/functions/generate-embeddings/index.ts` - Edge Function

---

## 2. Document AI (PDF OCR)

### Configuration
- **Location**: `eu`
- **Processor ID**: `c741d9fd2e1301ad`
- **Processor Type**: Document OCR

### Supabase Secrets Required
```
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
DOCUMENT_AI_PROCESSOR_ID=c741d9fd2e1301ad
DOCUMENT_AI_LOCATION=eu
```

### Flow
1. PDF uploaded to Supabase Storage
2. Edge Function downloads PDF
3. Sends to Document AI for OCR
4. Extracted text stored in `instructions.content`
5. Triggers embedding generation

---

## 3. AI Chat (Gemini)

### Configuration
- **Model**: `gemini-2.0-flash-001`
- **Location**: `europe-west4`
- **Temperature**: 0.3 (factual RAG)

### Files
- `src/lib/vertex-chat.ts` - Client that calls Edge Function
- `supabase/functions/gemini-chat/index.ts` - Edge Function

### Features
- Non-streaming responses via Edge Function
- Graceful error handling with user-friendly fallback
- PII masking before sending to AI

---

## 4. Vertex AI Search (Discovery Engine)

### Configuration
- **Data Store ID**: `tetrivo-docs-eu_1769527932986_gcs_store`
- **Location**: `global`
- **Source**: GCS bucket `tetrivo-docs-eu`

### Features
- Hybrid search (keyword + semantic)
- Auto query expansion
- Spell correction
- Grounded answers with citations (optional)

### Files
- `src/lib/vertex-search.ts` - Client
- `supabase/functions/vertex-search/index.ts` - Edge Function
- `supabase/functions/vertex-admin/index.ts` - Admin operations

### Search Flow
1. Try Vertex AI Search first (if Data Store has matching docs)
2. If no DB match for results, fall back to embedding search
3. Apply smart re-ranking
4. Generate answer with Gemini

---

## 5. Smart Search Ranking

### Implementation
Added `smartRerank()` function in `src/app/api/ask/route.ts`

### Ranking Signals

| Signal | Boost | Description |
|--------|-------|-------------|
| Exact title match | +0.5 | Query exactly matches instruction title |
| Partial title match | +0.3 | Query contains or is contained in title |
| Words in title | +0.15 | Query words appear in title |
| Critical severity | +0.1 | Instructions marked as critical |
| Low severity | -0.05 | Instructions marked as low priority |
| Recently updated | +0.05 | Updated within last 30 days |
| Stale content | -0.02 | Not updated in over 1 year |

---

## 5. Edge Functions (Deployed)

All Edge Functions are deployed at `https://rshukldzekufrlkbsqrr.supabase.co/functions/v1/`

| Function | Version | Purpose | JWT |
|----------|---------|---------|-----|
| `generate-embeddings` | v8 | Vertex AI embeddings (768 dim) | No |
| `process-document` | v6 | Document AI OCR for PDFs | No |
| `gemini-chat` | v1 | Gemini 2.0 Flash responses | No |
| `vertex-search` | v2 | Vertex AI Search (Discovery Engine) | No |
| `vertex-admin` | v1 | Data Store management (import, list) | No |

### Local Files
```
supabase/functions/
├── generate-embeddings/index.ts
├── process-document/index.ts
├── gemini-chat/index.ts
├── vertex-search/index.ts
└── vertex-admin/index.ts
```

### Deploy Commands
```bash
supabase functions deploy generate-embeddings
supabase functions deploy process-document
supabase functions deploy gemini-chat
supabase functions deploy vertex-search
supabase functions deploy vertex-admin
```

---

## 6. Environment Variables

### Required (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rshukldzekufrlkbsqrr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Cloud (Vertex AI, Document AI)
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"tetrivo-eu",...}
GCS_BUCKET_NAME=tetrivo-docs-eu
VERTEX_DATA_STORE_ID=tetrivo-docs-eu_1769527932986
VERTEX_SEARCH_APP_ID=tetrivo-search_1769528509783
```

### Supabase Edge Function Secrets
```
GOOGLE_CREDENTIALS_JSON=<full service account JSON>
DOCUMENT_AI_PROCESSOR_ID=c741d9fd2e1301ad
DOCUMENT_AI_LOCATION=eu
```

---

## 7. Files Modified/Created

### Client Library Files (Next.js)
- `src/lib/embeddings.ts` - Calls generate-embeddings Edge Function
- `src/lib/vertex-chat.ts` - Calls gemini-chat Edge Function
- `src/lib/vertex-search.ts` - Calls vertex-search Edge Function
- `src/lib/edge-functions.ts` - Edge Function trigger utilities
- `src/lib/logger.ts` - Structured logging (Pino)
- `src/lib/cache.ts` - Redis caching for search

### Edge Function Files (Deno)
- `supabase/functions/generate-embeddings/index.ts` - Vertex AI embeddings
- `supabase/functions/process-document/index.ts` - Document AI OCR
- `supabase/functions/gemini-chat/index.ts` - Gemini 2.0 Flash
- `supabase/functions/vertex-search/index.ts` - Discovery Engine search
- `supabase/functions/vertex-admin/index.ts` - Data Store management

### Modified Files
- `src/app/api/ask/route.ts` - Smart ranking, Edge Function calls
- `src/app/api/upload/route.ts` - Edge Function triggers
- `tsconfig.json` - Exclude supabase/functions

---

## 8. Migration History

### 2026-01-27: Embedding Dimension Change
```sql
-- Migration: change_embedding_dimensions_to_768
DROP INDEX IF EXISTS instructions_embedding_idx;
DROP INDEX IF EXISTS instruction_chunks_embedding_idx;
UPDATE instructions SET embedding = NULL;
DELETE FROM instruction_chunks;
ALTER TABLE instructions ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE instruction_chunks ALTER COLUMN embedding TYPE vector(768);
CREATE INDEX instructions_embedding_idx ON instructions USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX instruction_chunks_embedding_idx ON instruction_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## 9. Testing

### Test PDF Upload Flow
1. Upload PDF via admin interface
2. Check Edge Function logs: Supabase Dashboard > Functions > Logs
3. Verify in database:
```sql
SELECT id, title, LENGTH(content), embedding IS NOT NULL 
FROM instructions 
ORDER BY created_at DESC LIMIT 5;
```

### Test AI Chat
1. Ask a question about uploaded content
2. Verify source link works
3. Check smart ranking in dev logs

---

## 10. Troubleshooting

### Edge Function Errors
```bash
# Check logs in Supabase Dashboard or via CLI
supabase functions logs generate-embeddings --tail
supabase functions logs process-document --tail
```

### Document AI Errors
- Verify `DOCUMENT_AI_PROCESSOR_ID` is correct
- Check processor is enabled in GCP Console
- Verify service account has `Document AI API User` role

### Embedding Dimension Mismatch
If you see "expected X dimensions, not Y":
1. Check current column: `SELECT format_type(atttypid, atttypmod) FROM pg_attribute WHERE attname = 'embedding';`
2. Run migration to correct dimensions

### AI Chat Not Responding
1. Check Gemini model availability in `europe-west4`
2. Verify `GOOGLE_CREDENTIALS_JSON` has Vertex AI permissions
3. Check rate limits in GCP Console

---

## 11. Cost Estimates (Monthly)

| Service | Free Tier | After Free |
|---------|-----------|------------|
| Document AI OCR | 1,000 pages | ~$1.50/1000 pages |
| Vertex AI Embeddings | Varies | ~$0.025/1000 chars |
| Vertex AI Search | Varies | ~$2.50/1000 queries |
| Cloud Storage | 5 GB | ~$0.02/GB |
| Gemini 2.0 Flash | Varies | ~$0.075/1M input tokens |

---

## 12. Security Notes

- Service account JSON contains private key - never commit to git
- Edge Functions use `verify_jwt: false` for internal calls
- All data stays in EU region (europe-west4, eu)
- PII is masked before sending to AI (see `maskPII()`)

---

*Last updated: January 28, 2026*
