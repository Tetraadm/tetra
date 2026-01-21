/**
 * Text Chunking Module
 * 
 * Splits long documents into smaller, overlapping chunks for better vector search.
 * Each chunk is small enough to fit in the embedding model's context window
 * while maintaining enough overlap to preserve context across boundaries.
 */

export interface TextChunk {
    index: number
    content: string
    startChar: number
    endChar: number
}

// Configuration
const DEFAULT_CHUNK_SIZE = 800      // Target chunk size in characters
const DEFAULT_CHUNK_OVERLAP = 100   // Overlap between chunks
const MIN_CHUNK_SIZE = 100          // Minimum chunk size to keep

/**
 * Split text into overlapping chunks for embedding.
 * 
 * Algorithm:
 * 1. Try to split on paragraph boundaries (\n\n)
 * 2. Fall back to sentence boundaries (. ! ?)
 * 3. Fall back to word boundaries (space)
 * 4. Last resort: hard split at chunk size
 * 
 * @param text - The text to chunk
 * @param chunkSize - Target size for each chunk (default 800)
 * @param overlap - Characters of overlap between chunks (default 100)
 * @returns Array of text chunks with metadata
 */
export function chunkText(
    text: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_CHUNK_OVERLAP
): TextChunk[] {
    if (!text || text.trim().length === 0) {
        return []
    }

    // Normalize whitespace
    const normalizedText = text.replace(/\r\n/g, '\n').trim()

    // If text is short enough, return as single chunk
    if (normalizedText.length <= chunkSize) {
        return [{
            index: 0,
            content: normalizedText,
            startChar: 0,
            endChar: normalizedText.length
        }]
    }

    const chunks: TextChunk[] = []
    let currentPos = 0
    let chunkIndex = 0

    while (currentPos < normalizedText.length) {
        // Calculate end position for this chunk
        let endPos = Math.min(currentPos + chunkSize, normalizedText.length)

        // If we're not at the end, try to find a good break point
        if (endPos < normalizedText.length) {
            endPos = findBreakPoint(normalizedText, currentPos, endPos)
        }

        const chunkContent = normalizedText.slice(currentPos, endPos).trim()

        // Only add chunk if it has meaningful content
        if (chunkContent.length >= MIN_CHUNK_SIZE) {
            chunks.push({
                index: chunkIndex,
                content: chunkContent,
                startChar: currentPos,
                endChar: endPos
            })
            chunkIndex++
        }

        // Move position forward, accounting for overlap
        // Don't overlap if we're at the last chunk
        if (endPos >= normalizedText.length) {
            break
        }

        currentPos = Math.max(currentPos + 1, endPos - overlap)
    }

    return chunks
}

/**
 * Find the best break point for a chunk.
 * Prefers paragraph > sentence > word boundaries.
 */
function findBreakPoint(text: string, start: number, maxEnd: number): number {
    const searchWindow = text.slice(start, maxEnd)

    // Try to find paragraph break (double newline)
    const paragraphBreak = searchWindow.lastIndexOf('\n\n')
    if (paragraphBreak > searchWindow.length * 0.5) {
        return start + paragraphBreak + 2
    }

    // Try to find sentence break
    const sentenceBreaks = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
    let bestBreak = -1

    for (const marker of sentenceBreaks) {
        const pos = searchWindow.lastIndexOf(marker)
        if (pos > bestBreak && pos > searchWindow.length * 0.5) {
            bestBreak = pos
        }
    }

    if (bestBreak !== -1) {
        return start + bestBreak + 2
    }

    // Try to find word break
    const wordBreak = searchWindow.lastIndexOf(' ')
    if (wordBreak > searchWindow.length * 0.3) {
        return start + wordBreak + 1
    }

    // Fall back to hard break
    return maxEnd
}

/**
 * Prepare chunks with title context for embedding.
 * Prepends instruction title to each chunk for better semantic matching.
 * 
 * @param title - The instruction title
 * @param chunks - Array of text chunks
 * @returns Array of strings ready for embedding
 */
export function prepareChunksForEmbedding(
    title: string,
    chunks: TextChunk[]
): string[] {
    return chunks.map(chunk => `${title}\n\n${chunk.content}`)
}
