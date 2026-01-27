/**
 * Document AI Stub Module
 * 
 * NOTE: Full Document AI implementation was removed due to bundler 
 * compatibility issues with @google-cloud/documentai in Next.js.
 * 
 * This stub provides the same interface but always falls back to pdf-parse.
 * Document AI can be re-enabled when Next.js/Turbopack better supports 
 * Google Cloud packages.
 */

import { aiLogger, createTimer } from './logger'

/**
 * Extract text from a PDF using pdf-parse
 */
export async function extractPdfText(fileBytes: Uint8Array): Promise<string> {
  const timer = createTimer(aiLogger, 'pdf_extraction')
  
  try {
    // Use pdf-parse for extraction
    const pdfParse = (await import('pdf-parse')).default
    const buffer = Buffer.from(fileBytes)
    const result = await pdfParse(buffer)
    
    timer.end({ method: 'pdf-parse', bytes: fileBytes.length, pages: result.numpages })
    return result.text
  } catch (error) {
    timer.fail(error, { method: 'pdf-parse' })
    throw error
  }
}

/**
 * Check if Document AI is properly configured
 * NOTE: Currently always returns false due to bundler issues
 */
export function isDocumentAIConfigured(): boolean {
  return false
}
