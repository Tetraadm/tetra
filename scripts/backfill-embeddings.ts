/**
 * Backfill script to generate embeddings for existing instructions
 * 
 * Run with: npx tsx scripts/backfill-embeddings.ts
 * 
 * Requires:
 * - OPENAI_API_KEY environment variable
 * - SUPABASE_SERVICE_ROLE_KEY environment variable  
 * - NEXT_PUBLIC_SUPABASE_URL environment variable
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

// Configuration
const BATCH_SIZE = 10
const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_INPUT_CHARS = 8000

async function main() {
    console.log('🚀 Starting embedding backfill...\n')

    // Validate environment variables
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

    // Fetch all instructions without embeddings
    const { data: instructions, error } = await supabase
        .from('instructions')
        .select('id, title, content')
        .is('embedding', null)
        .is('deleted_at', null)
        .not('content', 'is', null)

    if (error) {
        console.error('❌ Failed to fetch instructions:', error.message)
        process.exit(1)
    }

    if (!instructions || instructions.length === 0) {
        console.log('✅ No instructions need embeddings!')
        return
    }

    console.log(`📝 Found ${instructions.length} instructions without embeddings\n`)

    let successCount = 0
    let errorCount = 0

    // Process in batches
    for (let i = 0; i < instructions.length; i += BATCH_SIZE) {
        const batch = instructions.slice(i, i + BATCH_SIZE)
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(instructions.length / BATCH_SIZE)}...`)

        for (const instruction of batch) {
            try {
                // Prepare text for embedding
                const text = `${instruction.title}\n\n${instruction.content || ''}`.slice(0, MAX_INPUT_CHARS)

                // Generate embedding
                const response = await openai.embeddings.create({
                    model: EMBEDDING_MODEL,
                    input: text,
                })

                const embedding = response.data[0].embedding

                // Store in database
                const { error: updateError } = await supabase
                    .from('instructions')
                    .update({ embedding: JSON.stringify(embedding) })
                    .eq('id', instruction.id)

                if (updateError) {
                    console.error(`  ❌ Failed to store embedding for "${instruction.title}":`, updateError.message)
                    errorCount++
                } else {
                    console.log(`  ✅ ${instruction.title}`)
                    successCount++
                }
            } catch (err) {
                console.error(`  ❌ Failed to generate embedding for "${instruction.title}":`, err)
                errorCount++
            }
        }

        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < instructions.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    console.log('\n📊 Summary:')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('\n🎉 Backfill complete!')
}

main().catch(console.error)
