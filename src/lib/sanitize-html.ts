/**
 * Server-side HTML sanitization utilities
 * 
 * F-005: Prevents XSS attacks by sanitizing user input before storage/display.
 * Used in contact, GDPR request, and instructions API routes.
 * 
 * Uses the sanitize-html library for robust XSS protection.
 */

import sanitize from 'sanitize-html'

/**
 * Allowed HTML tags for formatted content (instructions, etc.)
 * This whitelist allows basic formatting while blocking dangerous elements.
 */
const ALLOWED_TAGS = [
    'b', 'i', 'em', 'strong', 'u', 's', 'strike',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'pre', 'code',
    'a', 'span', 'div'
]

/**
 * Allowed attributes per tag
 */
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
    'a': ['href', 'title', 'target', 'rel'],
    'span': ['class'],
    'div': ['class'],
    'p': ['class'],
    '*': [] // No global attributes allowed
}

/**
 * Sanitizes HTML content, allowing safe formatting tags.
 * Use for content that should retain some formatting (e.g., instructions).
 * 
 * @param input - Raw user input string that may contain HTML
 * @returns Sanitized string with only allowed HTML tags
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
        return ''
    }

    return sanitize(input, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: ALLOWED_ATTRIBUTES,
        // Only allow safe URL schemes
        allowedSchemes: ['http', 'https', 'mailto'],
        // Force target="_blank" links to have noopener
        transformTags: {
            'a': (tagName, attribs) => {
                return {
                    tagName,
                    attribs: {
                        ...attribs,
                        rel: 'noopener noreferrer',
                        target: '_blank'
                    }
                }
            }
        },
        // Don't allow any custom protocols in URLs
        allowProtocolRelative: false,
        // Strip all non-allowed tags completely
        disallowedTagsMode: 'discard'
    }).trim()
}

/**
 * Strips ALL HTML tags from input, returning plain text.
 * Use for content that should have no formatting at all (e.g., titles, names).
 * 
 * @param input - Raw user input string
 * @returns Plain text with all HTML removed
 */
export function stripHtml(input: string): string {
    if (!input || typeof input !== 'string') {
        return ''
    }

    return sanitize(input, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim()
}

/**
 * Escapes HTML special characters for safe display.
 * Use when content needs to be displayed as-is without rendering HTML.
 * 
 * @param input - Raw string to escape
 * @returns HTML-escaped string
 */
export function escapeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
        return ''
    }

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
}
