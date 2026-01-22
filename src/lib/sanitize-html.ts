/**
 * Server-side HTML sanitization utilities
 * 
 * F-005: Prevents XSS attacks by sanitizing user input before storage/display.
 * Used in contact, GDPR request, and instructions API routes.
 */

/**
 * Removes HTML tags and script elements from input string.
 * Provides basic XSS protection for user-submitted content.
 * 
 * @param input - Raw user input string
 * @returns Sanitized string with HTML removed
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove style tags and their content
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove all remaining HTML tags
        .replace(/<[^>]*>/g, '')
        // Decode common HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
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
        return '';
    }

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
