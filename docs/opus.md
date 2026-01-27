# Tetrivo HMS Platform - Google Cloud Integration Session

**Date**: January 2025  
**Session**: Claude Opus Development Session

---

## Overview

This document captures the complete development session where we integrated Google Cloud services into the Tetrivo HMS platform, including Vertex AI Search, Cloud Storage, and Supabase Edge Functions.

---

## 1. Fixed AI Chat Source Linking Issue

### Problem
AI responses showed UUID instead of document title, and source links didn't work properly.

### Solution
Added database lookup in the ask route to match Vertex Search results with instructions by `file_path` or UUID.

### Files Modified
- `src/app/api/ask/route.ts`
- `src/lib/vertex-search.ts`

### Code Changes

In `src/app/api/ask/route.ts`, we added logic to:
1. Extract document IDs from Vertex Search results
2. Query Supabase to get the actual instruction titles
3. Map the results back to provide proper titles and working links

---

## 2. Fixed Critical Bugs

### 2.1 Duplicate Return Statement
- **File**: `src/app/api/upload/route.ts:305-306`
- **Issue**: Duplicate return statement causing unreachable code
- **Fix**: Removed the duplicate

### 2.2 Sensitive Debug Logging
- **Issue**: Production logs contained sensitive information
- **Fix**: Wrapped debug logging in `process.env.NODE_ENV === 'development'` checks

### 2.3 GCS Cleanup for GDPR
- **File**: `src/app/api/gdpr-cleanup/route.ts`
- **Issue**: Soft-deleted instructions weren't being cleaned up from GCS
- **Fix**: Added GCS cleanup logic alongside Supabase Storage cleanup

---

## 3. Improved Streaming Performance

### 3.1 Vertex Chat Updates
**File**: `src/lib/vertex-chat.ts`

Changes:
- Added connection pooling for better performance
- Switched to faster Gemini model
- Improved error handling

### 3.2 Employee Chat Hook Updates
**File**: `src/app/(platform)/instructions/employee/hooks/useEmployeeChat.ts`

Changes:
- Added throttling (30ms) for streaming updates
- Used `startTransition` for smoother UI updates
- Reduced re-renders during streaming

---

## 4. Added Structured Logging

### New File: `src/lib/logger.ts`

Created a structured logging utility using Pino that:
- Outputs JSON-formatted logs compatible with Google Cloud Logging
- Includes request context (user ID, organization ID)
- Has different log levels (debug, info, warn, error)
- Only logs debug in development

### Usage Example
```typescript
import { logger } from '@/lib/logger';

logger.info('User uploaded document', { 
  userId: user.id, 
  fileName: file.name 
});
```

---

## 5. Added Redis Caching

### New File: `src/lib/cache.ts`

Created a caching layer for Vertex Search results:
- Uses Upstash Redis
- 60-second TTL for search results
- Reduces API calls to Vertex AI Search
- Graceful fallback if Redis unavailable

### Integration
Updated `src/lib/vertex-search.ts` to check cache before making API calls.

---

## 6. Supabase Edge Functions for Async Processing

### Background
Next.js Turbopack bundler has incompatibility issues with Google Cloud packages:
- `@google-cloud/tasks`
- `@google-cloud/documentai`
- `@google-cloud/aiplatform`

These packages use Node.js-specific APIs that don't work with the edge runtime or Turbopack.

### Solution
Created Supabase Edge Functions running on Deno to handle Google Cloud integrations.

### New Files Structure

```
supabase/functions/
├── _shared/
│   └── google-auth.ts       # Shared Google Cloud auth for Deno
├── generate-embeddings/
│   └── index.ts             # Vertex AI/OpenAI embeddings generation
└── process-document/
    └── index.ts             # Google Document AI for PDF extraction
```

### 6.1 Shared Google Auth (`supabase/functions/_shared/google-auth.ts`)

Handles Google Cloud authentication in Deno environment:
- Parses service account JSON from environment
- Generates JWT tokens for Google APIs
- Exchanges JWT for access tokens

### 6.2 Generate Embeddings Function (`supabase/functions/generate-embeddings/index.ts`)

Generates embeddings for document chunks:
- Supports both Vertex AI and OpenAI providers
- Handles chunking of large documents
- Stores embeddings in Supabase database
- CORS-enabled for browser calls

**Request Format:**
```json
{
  "instructionId": "uuid",
  "content": "document text",
  "provider": "openai" // or "vertex"
}
```

### 6.3 Process Document Function (`supabase/functions/process-document/index.ts`)

Extracts text from PDFs using Google Document AI:
- Fetches PDF from Supabase Storage
- Sends to Document AI for OCR/extraction
- Returns extracted text

**Request Format:**
```json
{
  "storagePath": "org-id/file.pdf",
  "processorId": "processor-id" // optional
}
```

### Supporting Files in src/lib/

#### `src/lib/edge-functions.ts`
Client for calling Supabase Edge Functions from Next.js:
```typescript
import { callEdgeFunction } from '@/lib/edge-functions';

const result = await callEdgeFunction('generate-embeddings', {
  instructionId: id,
  content: text,
  provider: 'openai'
});
```

#### `src/lib/cloud-tasks.ts`
Stub file (disabled due to bundler issues):
- Contains placeholder for Cloud Tasks integration
- Currently disabled, using Edge Functions instead

#### `src/lib/document-ai.ts`
Stub with fallback:
- Attempts Edge Function call for Document AI
- Falls back to pdf-parse for local extraction

---

## 7. Updated Upload Route

**File**: `src/app/api/upload/route.ts`

Changes:
- Triggers async embedding generation via Edge Functions when configured
- Falls back to synchronous processing if Edge Functions unavailable
- Uploads to both Supabase Storage and GCS (for Vertex AI Search indexing)

### Flow
1. User uploads file
2. File stored in Supabase Storage
3. File copied to GCS bucket
4. Edge Function triggered for embedding generation (async)
5. Vertex AI Search indexes from GCS

---

## 8. TypeScript Configuration Update

**File**: `tsconfig.json`

Added `"supabase/functions"` to exclude array:
```json
{
  "exclude": [
    "node_modules",
    "supabase/functions"
  ]
}
```

This prevents TypeScript from trying to compile Deno files with Node.js types.

---

## Current State

### Pending Fixes (ESLint Errors)

1. **`src/app/api/upload/route.ts`**:
   - Unused variables: `PDF_MAX_PAGES`, `PDF_PAGE_TIMEOUT_MS`
   - `@ts-ignore` should be `@ts-expect-error`
   - `require()` import (acceptable for pdf-parse compatibility)

2. **`src/app/api/tasks/process/route.ts`**:
   - `any` type on line 53

3. **`src/lib/vertex-search.ts`**:
   - Multiple `any` types that need proper typing

4. **`supabase/functions/generate-embeddings/index.ts`**:
   - Multiple `any` types (Deno files, may need different handling)

---

## Architecture Decisions

### 1. Dual Storage Strategy
Files are stored in both:
- **Supabase Storage**: Primary storage, used by the application
- **Google Cloud Storage**: For Vertex AI Search indexing

### 2. Embedding Provider
- **Primary**: OpenAI embeddings (simpler integration)
- **Alternative**: Vertex AI Embeddings available via Edge Functions

### 3. PDF Text Extraction
- **Next.js**: pdf-parse library (synchronous)
- **Edge Functions**: Document AI available for better OCR

### 4. Async Processing
- **Approach**: Supabase Edge Functions
- **Reason**: Cloud Tasks incompatible with Turbopack bundler

---

## Environment Variables

### Required
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Google Cloud
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
```

### For Vertex AI Search
```env
VERTEX_SEARCH_APP_ID=your-app-id
VERTEX_DATA_STORE_ID=your-datastore-id
GCS_BUCKET_NAME=tetrivo-documents-eu
```

### For Document AI (Edge Functions)
```env
DOCUMENT_AI_LOCATION=eu
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
```

---

## Deployment Instructions

### 1. Fix Remaining Lint Errors
```bash
npm run lint -- --fix
```

### 2. Commit Changes
```bash
git add .
git commit -m "feat: add Google Cloud integrations with Supabase Edge Functions"
```

### 3. Deploy Supabase Edge Functions
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Set secrets
supabase secrets set GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
supabase secrets set OPENAI_API_KEY='sk-...'

# Deploy functions
supabase functions deploy generate-embeddings
supabase functions deploy process-document
```

### 4. Push to Remote
```bash
git push origin main
```

---

## File Change Summary

### New Files Created
- `src/lib/logger.ts`
- `src/lib/cache.ts`
- `src/lib/edge-functions.ts`
- `src/lib/cloud-tasks.ts` (stub)
- `src/lib/document-ai.ts` (stub with fallback)
- `supabase/functions/_shared/google-auth.ts`
- `supabase/functions/generate-embeddings/index.ts`
- `supabase/functions/process-document/index.ts`

### Modified Files
- `src/app/api/ask/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/gdpr-cleanup/route.ts`
- `src/lib/vertex-search.ts`
- `src/lib/vertex-chat.ts`
- `src/app/(platform)/instructions/employee/hooks/useEmployeeChat.ts`
- `tsconfig.json`

---

## Next Steps

1. Fix remaining ESLint errors
2. Commit and push changes
3. Deploy Supabase Edge Functions
4. Test the full upload -> embedding -> search flow
5. Monitor Cloud Logging for any issues
6. Consider adding retry logic for Edge Function calls

---

## Troubleshooting

### Edge Function Errors
Check logs:
```bash
supabase functions logs generate-embeddings
supabase functions logs process-document
```

### Vertex AI Search Not Returning Results
1. Verify GCS bucket has files
2. Check Data Store is configured correctly
3. Ensure Search App is linked to Data Store

### Embedding Generation Failing
1. Check OpenAI API key is valid
2. Verify Edge Function secrets are set
3. Check function logs for specific errors

---

*End of Session Documentation*
