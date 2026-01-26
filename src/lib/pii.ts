/**
 * PII (Personally Identifiable Information) Masking Utilities
 * 
 * Used to mask sensitive data before logging/storing to protect user privacy.
 * Handles:
 * - Email addresses
 * - Norwegian phone numbers (8 digits, with or without country code)
 * - Norwegian national ID (fødselsnummer - 11 digits)
 * - Credit card numbers (basic pattern)
 */

// Email pattern: matches common email formats
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi

// Norwegian phone number patterns:
// - 8 consecutive digits
// - With spaces: XX XX XX XX
// - With country code: +47 XXXXXXXX or 0047 XXXXXXXX
const PHONE_PATTERNS = [
  /\+47\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/g,  // +47 XX XX XX XX
  /0047\s?\d{8}/g,                            // 0047XXXXXXXX
  /\b\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\b/g,      // XX XX XX XX (Norwegian mobile/landline)
]

// Norwegian national ID (fødselsnummer): 11 consecutive digits
// Format: DDMMYY XXXXX (6 digits birthdate + 5 digits)
const FODSELSNUMMER_PATTERN = /\b\d{11}\b/g

// Credit card pattern: 4 groups of 4 digits
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g

/**
 * Masks PII in a given text string.
 * 
 * @param text - The input text that may contain PII
 * @returns Text with PII masked (e.g., "john@example.com" -> "[EMAIL]")
 */
export function maskPII(text: string): string {
  if (!text) return text
  
  let masked = text
  
  // Mask emails first (most specific pattern)
  masked = masked.replace(EMAIL_PATTERN, '[EMAIL]')
  
  // Mask Norwegian phone numbers
  for (const pattern of PHONE_PATTERNS) {
    masked = masked.replace(pattern, '[PHONE]')
  }
  
  // Mask fødselsnummer (11 digits)
  masked = masked.replace(FODSELSNUMMER_PATTERN, '[PERSONNUMMER]')
  
  // Mask credit card numbers
  masked = masked.replace(CREDIT_CARD_PATTERN, '[CARD]')
  
  return masked
}

/**
 * Checks if text contains potential PII.
 * Useful for logging decisions.
 */
export function containsPII(text: string): boolean {
  if (!text) return false
  
  if (EMAIL_PATTERN.test(text)) return true
  
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) return true
  }
  
  if (FODSELSNUMMER_PATTERN.test(text)) return true
  if (CREDIT_CARD_PATTERN.test(text)) return true
  
  return false
}
