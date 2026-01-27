import { VertexAI } from '@google-cloud/vertexai'
import { getGoogleAuthOptions, getProjectId } from './vertex-auth'

const LOCATION = 'europe-west4'; // Creating the client for specific region for Gemini models
const MODEL_NAME = 'gemini-2.5-flash-preview-05-20' // Faster preview model with improved streaming

export type ChatMessage = {
    role: 'user' | 'model' | 'system'
    content: string
}

// Reusable VertexAI client (connection pooling)
let cachedVertexAI: VertexAI | null = null

function getVertexAI(): VertexAI {
    if (!cachedVertexAI) {
        const projectId = getProjectId()
        const authOptions = getGoogleAuthOptions()
        
        cachedVertexAI = new VertexAI({
            project: projectId,
            location: LOCATION,
            googleAuthOptions: authOptions.credentials ? { credentials: authOptions.credentials } : undefined
        })
    }
    return cachedVertexAI
}

export async function streamGeminiAnswer(
    systemInstruction: string,
    messages: ChatMessage[],
    onChunk: (text: string) => void
): Promise<string> {
    const vertexAI = getVertexAI()

    const model = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: {
            role: 'system',
            parts: [{ text: systemInstruction }]
        },
        generationConfig: {
            temperature: 0.1, // Low temperature for factual RAG
            maxOutputTokens: 800, // Reduced for faster response
            candidateCount: 1
        }
    })

    // Convert messages to Gemini format
    // Note: Gemini doesn't support 'system' in history (it's separate above), and roles are 'user'/'model'
    const history = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'model' ? 'model' : 'user', // Ensure strict mapping
            parts: [{ text: m.content }]
        }))

    // The last message is the new prompt
    const lastMessage = history.pop()
    if (!lastMessage) throw new Error('No messages provided')

    const chatSession = model.startChat({
        history: history
    })

    try {
        const result = await chatSession.sendMessageStream(lastMessage.parts[0].text)

        let fullText = ''

        for await (const chunk of result.stream) {
            const chunkText = chunk.candidates?.[0].content.parts[0].text || ''
            if (chunkText) {
                fullText += chunkText
                onChunk(chunkText)
            }
        }

        return fullText

    } catch (error) {
        console.error('Gemini Stream Error:', error)
        throw error
    }
}

// Non-streaming fallback
export async function generateGeminiAnswer(
    systemInstruction: string,
    messages: ChatMessage[]
): Promise<string> {
    const projectId = getProjectId()
    const vertexAI = new VertexAI({
        project: projectId,
        location: LOCATION,
        // credentials handled auto or via env
    })

    const model = vertexAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: systemInstruction
    })

    const content = messages.map(m => m.content).join('\n') // Simple join for single-turn usually used in RAG

    const result = await model.generateContent(content)
    const response = await result.response
    return response.candidates?.[0].content.parts[0].text || ''
}
