# Tetrivo HMS Platform - Google Cloud Integration

**Date**: January 2025 (Updated: January 27, 2026)  
**Status**: Production Ready

---

## Overview

This document captures the complete Google Cloud integration for the Tetrivo HMS platform. The system uses:
- **Vertex AI Embeddings** (768 dimensions) for semantic search
- **Google Document AI** for PDF text extraction (OCR)
- **Gemini 2.0 Flash** for AI-powered answers
- **Supabase Edge Functions** for async processing

---

## Architecture

```
User uploads PDF
       |
       v
+------------------+     +----------------------+
| Next.js Upload   |---->| Supabase Storage     |
+------------------+     +----------------------+
       |                          |
       v                          v
+------------------+     +----------------------+
| Edge Function:   |<----| process-document     |
| Document AI OCR  |     | (downloads PDF)      |
+------------------+     +----------------------+
       |
       v
+------------------+     +----------------------+
| Edge Function:   |---->| Supabase Database    |
| generate-embed.  |     | (768-dim vectors)    |
+------------------+     +----------------------+
       |
       v
+------------------+
| AI Search Ready  |
+------------------+
```

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
- **Temperature**: 0.1 (factual RAG)

### File
- `src/lib/vertex-chat.ts`

### Features
- Streaming responses
- Connection pooling
- Graceful error handling with fallback message

---

## 4. Smart Search Ranking

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

### generate-embeddings (v6)
- **URL**: `https://rshukldzekufrlkbsqrr.supabase.co/functions/v1/generate-embeddings`
- **Status**: ACTIVE
- **JWT Verification**: Disabled (for internal calls)

### process-document (v6)
- **URL**: `https://rshukldzekufrlkbsqrr.supabase.co/functions/v1/process-document`
- **Status**: ACTIVE
- **JWT Verification**: Disabled (for internal calls)

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

### New Files
- `src/lib/embeddings.ts` - Vertex AI embeddings (HTTP API)
- `src/lib/vertex-chat.ts` - Gemini chat with streaming
- `src/lib/vertex-search.ts` - Vertex AI Search integration
- `src/lib/edge-functions.ts` - Edge Function client
- `src/lib/logger.ts` - Structured logging (Pino)
- `src/lib/cache.ts` - Redis caching for search
- `supabase/functions/generate-embeddings/index.ts`
- `supabase/functions/process-document/index.ts`

### Modified Files
- `src/app/api/ask/route.ts` - Smart ranking, Vertex AI check
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

*Last updated: January 27, 2026*
