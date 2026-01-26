export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { extractKeywords } from '@/lib/keyword-extraction'
import { generateEmbedding, generateEmbeddings, prepareTextForEmbedding } from '@/lib/embeddings'
import { chunkText, prepareChunksForEmbedding } from '@/lib/chunking'
import { z } from 'zod'
import { sanitizeHtml } from '@/lib/sanitize-html'

// Schema for updating an instruction
const UpdateInstructionSchema = z.object({
    title: z.string().min(1, 'Tittel er påkrevd').max(200),
    content: z.string().max(50000).optional().default(''),
    severity: z.enum(['low', 'medium', 'critical']).default('medium'),
    status: z.enum(['draft', 'published']).default('draft'),
    folderId: z.string().uuid().nullable().optional(),
    teamIds: z.array(z.string().uuid()).default([]),
})

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id || !z.string().uuid().safeParse(id).success) {
            return NextResponse.json({ error: 'Ugyldig instruks-ID' }, { status: 400 })
        }

        const body = await request.json()
        const validation = UpdateInstructionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Valideringsfeil', details: validation.error.format() },
                { status: 400 }
            )
        }

        const { title, content, severity, status, folderId, teamIds } = validation.data

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        // Get user profile to verify org membership and admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
        }

        // Verify the instruction exists and belongs to user's org
        const { data: existingInstruction, error: fetchError } = await supabase
            .from('instructions')
            .select('id, org_id, title, content')
            .eq('id', id)
            .is('deleted_at', null)
            .single()

        if (fetchError || !existingInstruction) {
            return NextResponse.json({ error: 'Instruks ikke funnet' }, { status: 404 })
        }

        if (existingInstruction.org_id !== profile.org_id) {
            return NextResponse.json({ error: 'Ingen tilgang til denne instruksen' }, { status: 403 })
        }

        // SECURITY: Validate that all teamIds belong to the user's org
        if (teamIds.length > 0) {
            const { count, error: teamCountError } = await supabase
                .from('teams')
                .select('*', { count: 'exact', head: true })
                .eq('org_id', profile.org_id)
                .in('id', teamIds)

            if (teamCountError) {
                console.error('TEAM_VALIDATION_ERROR:', teamCountError)
                return NextResponse.json({ error: 'Kunne ikke validere team' }, { status: 500 })
            }

            if (count !== teamIds.length) {
                return NextResponse.json({ error: 'Ugyldige team-IDer' }, { status: 400 })
            }
        }

        // Sanitize input
        const safeTitle = sanitizeHtml(title)
        const safeContent = content ? sanitizeHtml(content) : null

        // Generate keywords
        const textForKeywords = `${safeTitle} ${safeContent || ''}`.trim()
        const keywords = extractKeywords(textForKeywords, 10)

        // Generate document-level embedding
        let embedding = null
        try {
            if (textForKeywords.length > 5) {
                const textForEmbedding = prepareTextForEmbedding(safeTitle, safeContent || undefined)
                embedding = await generateEmbedding(textForEmbedding)
            }
        } catch (embErr) {
            console.error('EMBEDDING_ERROR:', embErr)
            // Continue without embedding
        }

        // Update instruction
        const { data: instruction, error: updateError } = await supabase
            .from('instructions')
            .update({
                title: safeTitle,
                content: safeContent,
                severity,
                status,
                folder_id: folderId || null,
                keywords,
                embedding: embedding ? JSON.stringify(embedding) : null
            })
            .eq('id', id)
            .select('*, folders(*)')
            .single()

        if (updateError) {
            console.error('INSTRUCTION_UPDATE_ERROR:', updateError)
            return NextResponse.json({ error: 'Kunne ikke oppdatere instruks' }, { status: 500 })
        }

        // P0-2 FIX: Re-index chunks when content is edited
        // Step 1: Delete old chunks
        const { error: deleteChunksError } = await supabase
            .from('instruction_chunks')
            .delete()
            .eq('instruction_id', id)

        if (deleteChunksError) {
            console.error('CHUNKS_DELETE_ERROR:', deleteChunksError)
            // Non-blocking - continue with re-generation
        }

        // Step 2: Generate new chunks if there's content
        if (safeContent && safeContent.trim().length > 0) {
            try {
                const chunks = chunkText(safeContent)

                if (chunks.length > 0) {
                    // Prepare chunk texts with title context
                    const chunkTexts = prepareChunksForEmbedding(safeTitle, chunks)

                    // Generate embeddings for all chunks in batch
                    const chunkEmbeddings = await generateEmbeddings(chunkTexts)

                    // Insert new chunks (fts is GENERATED - do NOT set it)
                    const chunkInserts = chunks.map((chunk, idx) => ({
                        instruction_id: id,
                        chunk_index: chunk.index,
                        content: chunk.content,
                        embedding: JSON.stringify(chunkEmbeddings[idx])
                    }))

                    const { error: chunksError } = await supabase
                        .from('instruction_chunks')
                        .insert(chunkInserts)

                    if (chunksError) {
                        console.error('CHUNKS_INSERT_ERROR:', chunksError)
                        // Non-blocking
                    }
                }
            } catch (chunkErr) {
                console.error('CHUNK_GENERATION_ERROR:', chunkErr)
                // Non-blocking
            }
        }

        // Update team mappings
        // First delete existing mappings
        await supabase
            .from('instruction_teams')
            .delete()
            .eq('instruction_id', id)

        // Then insert new mappings
        if (teamIds.length > 0) {
            const { error: teamLinkError } = await supabase
                .from('instruction_teams')
                .insert(teamIds.map(tid => ({
                    instruction_id: id,
                    team_id: tid
                })))

            if (teamLinkError) {
                console.error('TEAM_LINK_ERROR:', teamLinkError)
            }
        }

        return NextResponse.json(instruction)

    } catch (err) {
        console.error('API_ERROR:', err)
        return NextResponse.json({ error: 'Serverfeil' }, { status: 500 })
    }
}
