import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { chunkText, prepareChunksForEmbedding } from '../src/lib/chunking'
import { generateEmbeddings } from '../src/lib/embeddings'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function reindexInstructions() {
    console.log('🔄 Starting re-indexing of instructions...')

    // 1. Fetch all published instructions with content
    const { data: instructions, error } = await supabase
        .from('instructions')
        .select('id, title, content')
        .eq('status', 'published')
        .not('content', 'is', null)

    if (error) {
        console.error('Failed to fetch instructions:', error)
        return
    }

    console.log(`Found ${instructions.length} instructions. Checking for missing chunks...`)

    let processedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const instruction of instructions) {
        // 2. Check if chunks already exist
        const { count } = await supabase
            .from('instruction_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('instruction_id', instruction.id)

        if (count && count > 0) {
            console.log(`[SKIP] Instruction "${instruction.title}" already has ${count} chunks.`)
            skippedCount++
            continue
        }

        console.log(`[PROCESS] processing "${instruction.title}"...`)

        try {
            if (!instruction.content || !instruction.content.trim()) {
                console.warn(`[WARN] Instruction "${instruction.title}" has empty content. Skipping.`)
                continue
            }

            // 3. Generate chunks
            const chunks = chunkText(instruction.content)

            if (chunks.length === 0) {
                console.warn(`[WARN] No chunks generated for "${instruction.title}". Content likely too short.`)
                continue
            }

            // 4. Generate embeddings
            const chunkTexts = prepareChunksForEmbedding(instruction.title, chunks)
            const chunkEmbeddings = await generateEmbeddings(chunkTexts)

            // 5. Insert chunks
            const chunkInserts = chunks.map((chunk, idx) => ({
                instruction_id: instruction.id,
                chunk_index: chunk.index,
                content: chunk.content,
                embedding: JSON.stringify(chunkEmbeddings[idx])
                // fts is generated automatically
            }))

            const { error: insertError } = await supabase
                .from('instruction_chunks')
                .insert(chunkInserts)

            if (insertError) {
                console.error(`[ERROR] Failed to insert chunks for "${instruction.title}":`, insertError)
                errorCount++
            } else {
                console.log(`[SUCCESS] Inserted ${chunks.length} chunks for "${instruction.title}".`)
                processedCount++
            }

        } catch (err) {
            console.error(`[ERROR] Processing "${instruction.title}":`, err)
            errorCount++
        }
    }

    console.log('\n--- SUMMARY ---')
    console.log(`Verified: ${instructions.length}`)
    console.log(`Skipped (already chunked): ${skippedCount}`)
    console.log(`Processed (new chunks): ${processedCount}`)
    console.log(`Errors: ${errorCount}`)
}

reindexInstructions().catch(console.error)
