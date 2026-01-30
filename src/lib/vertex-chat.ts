import 'server-only'
/**
 * Vertex AI Chat Client
 * 
 * Calls the gemini-chat Edge Function for AI responses.
 * This avoids using the Google Cloud SDK which doesn't work with Turbopack.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET

const FALLBACK_MESSAGE = 'Finner ingen instrukser knyttet til dette i Tetrivo. Kontakt din nærmeste leder.'

export type ChatMessage = {
    role: 'user' | 'model' | 'system'
    content: string
}

type GeminiResponse = {
    answer: string
    error?: string
}

/**
 * Get headers for Edge Function calls
 */
function getEdgeFunctionHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY || ''
    }

    // Add shared secret for internal authentication
    if (EDGE_FUNCTION_SECRET) {
        headers['X-Edge-Secret'] = EDGE_FUNCTION_SECRET
    }

    return headers
}

/**
 * Stream Gemini answer (currently non-streaming via Edge Function)
 * The Edge Function returns the full response, which we pass to onChunk
 */
export async function streamGeminiAnswer(
    systemInstruction: string,
    messages: ChatMessage[],
    onChunk: (text: string) => void
): Promise<string> {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Supabase not configured for Gemini Edge Function')
            onChunk(FALLBACK_MESSAGE)
            return FALLBACK_MESSAGE
        }

        const userMessage = messages.map(m => m.content).join('\n')

        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
            method: 'POST',
            headers: getEdgeFunctionHeaders(),
            body: JSON.stringify({
                systemPrompt: systemInstruction,
                userMessage: userMessage,
                stream: false
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini Edge Function error:', response.status, errorText)
            onChunk(FALLBACK_MESSAGE)
            return FALLBACK_MESSAGE
        }

        const data: GeminiResponse = await response.json()

        if (data.error || !data.answer) {
            console.error('Gemini returned error:', data.error)
            onChunk(FALLBACK_MESSAGE)
            return FALLBACK_MESSAGE
        }

        // Send the full response as a single chunk
        onChunk(data.answer)
        return data.answer

    } catch (error) {
        console.error('Gemini Stream Error:', error)
        onChunk(FALLBACK_MESSAGE)
        return FALLBACK_MESSAGE
    }
}

/**
 * Generate Gemini answer (non-streaming)
 */
export async function generateGeminiAnswer(
    systemInstruction: string,
    messages: ChatMessage[]
): Promise<string> {
    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error('Supabase not configured for Gemini Edge Function')
            return ''
        }

        const userMessage = messages.map(m => m.content).join('\n')

        const response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-chat`, {
            method: 'POST',
            headers: getEdgeFunctionHeaders(),
            body: JSON.stringify({
                systemPrompt: systemInstruction,
                userMessage: userMessage,
                stream: false
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Gemini Edge Function error:', response.status, errorText)
            return ''
        }

        const data: GeminiResponse = await response.json()
        return data.answer || ''

    } catch (error) {
        console.error('Gemini Error:', error)
        return ''
    }
}
