/**
 * Debug script to test vector search directly
 * Run with: npx tsx scripts/test-vector-search.ts
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    if (!openaiKey) {
        console.error('❌ Missing OPENAI_API_KEY')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const openai = new OpenAI({ apiKey: openaiKey })

    const question = 'brann'
    console.log(`\n🔍 Testing vector search for: "${question}"\n`)

    // Step 1: Generate embedding
    console.log('1. Generating embedding...')
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: question,
    })
    const embedding = response.data[0].embedding
    console.log(`   ✅ Embedding generated, length: ${embedding.length}`)

    // Step 2: Format as PostgreSQL vector
    const embeddingStr = `[${embedding.join(',')}]`
    console.log(`   Embedding string length: ${embeddingStr.length}`)
    console.log(`   First 100 chars: ${embeddingStr.substring(0, 100)}...`)

    // Step 3: Call RPC
    console.log('\n2. Calling match_instructions RPC...')
    const { data: results, error } = await supabase
        .rpc('match_instructions', {
            query_embedding: embeddingStr,
            match_threshold: 0.25,
            match_count: 10,
            p_user_id: null
        })

    if (error) {
        console.error('   ❌ RPC Error:', error)
    } else {
        console.log(`   ✅ RPC returned ${results?.length ?? 0} results`)
        if (results && results.length > 0) {
            console.log('\n3. Results:')
            results.forEach((r: { title: string; similarity: number }, i: number) => {
                console.log(`   ${i + 1}. ${r.title} (similarity: ${(r.similarity * 100).toFixed(1)}%)`)
            })
        } else {
            console.log('\n   No results found. Checking if embeddings exist...')

            // Check embeddings
            const { data: instructions } = await supabase
                .from('instructions')
                .select('id, title, embedding')
                .not('embedding', 'is', null)
                .limit(3)

            if (instructions && instructions.length > 0) {
                console.log(`   Found ${instructions.length} instructions with embeddings`)
                instructions.forEach((i: { title: string; embedding: unknown }) => {
                    console.log(`   - ${i.title}`)
                })
            }
        }
    }
}

main().catch(console.error)
