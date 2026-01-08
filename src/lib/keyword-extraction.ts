/**
 * Simple keyword extraction using Norwegian stopwords and basic NLP
 * For MVP: Keep it simple with keyword matching and frequency analysis
 */

const NORWEGIAN_STOPWORDS = new Set([
  'og', 'i', 'å', 'det', 'som', 'på', 'er', 'av', 'til', 'for', 'med',
  'den', 'at', 'en', 'et', 'de', 'skal', 'har', 'kan', 'var', 'om',
  'ikke', 'bare', 'være', 'eller', 'man', 'fra', 'ved', 'da', 'når',
  'må', 'ble', 'inn', 'ut', 'over', 'etter', 'også', 'hvis', 'alle',
  'dette', 'denne', 'disse', 'hva', 'noen', 'noe', 'hvilke', 'hvor',
  'sin', 'sitt', 'sine', 'jeg', 'du', 'vi', 'de', 'meg', 'deg', 'seg'
])

/**
 * Extract keywords from text using simple word frequency analysis
 * Filters out stopwords and short words
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  if (!text) return []

  // Normalize text: lowercase, remove special characters
  const normalized = text
    .toLowerCase()
    .replace(/[^a-zæøå\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Split into words
  const words = normalized.split(' ')

  // Count word frequency
  const wordFreq = new Map<string, number>()

  for (const word of words) {
    // Skip stopwords and short words
    if (NORWEGIAN_STOPWORDS.has(word) || word.length < 3) continue

    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  }

  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Calculate simple relevance score between query and instruction keywords
 * Returns score between 0 and 1
 */
export function calculateRelevanceScore(
  queryKeywords: string[],
  instructionKeywords: string[],
  instructionTitle: string
): number {
  if (queryKeywords.length === 0) return 0

  let score = 0
  const titleLower = instructionTitle.toLowerCase()

  for (const queryKeyword of queryKeywords) {
    // Exact match in keywords
    if (instructionKeywords.includes(queryKeyword)) {
      score += 1.0
    }

    // Partial match in keywords
    const partialMatch = instructionKeywords.some(kw =>
      kw.includes(queryKeyword) || queryKeyword.includes(kw)
    )
    if (partialMatch) {
      score += 0.5
    }

    // Bonus for title match (more important)
    if (titleLower.includes(queryKeyword)) {
      score += 2.0
    }
  }

  // Normalize score (0-1 range)
  return Math.min(score / (queryKeywords.length * 2), 1.0)
}

/**
 * Filter and rank instructions based on query
 */
export type InstructionWithKeywords = {
  id: string
  title: string
  content: string | null
  keywords: string[]
  [key: string]: any
}

export function filterAndRankInstructions(
  query: string,
  instructions: InstructionWithKeywords[],
  maxResults: number = 10
): InstructionWithKeywords[] {
  const queryKeywords = extractKeywords(query, 5)

  if (queryKeywords.length === 0) {
    // If no keywords extracted, return first N instructions
    return instructions.slice(0, maxResults)
  }

  // Calculate relevance score for each instruction
  const scored = instructions.map(instruction => ({
    instruction,
    score: calculateRelevanceScore(
      queryKeywords,
      instruction.keywords || [],
      instruction.title
    )
  }))

  // Sort by score (descending) and return top results
  return scored
    .filter(item => item.score > 0) // Only include relevant results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(item => item.instruction)
}
