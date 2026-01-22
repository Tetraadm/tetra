import { describe, it, expect } from 'vitest'
import { sanitizeHtml, escapeHtml } from '@/lib/sanitize-html'

describe('sanitizeHtml', () => {
    describe('script removal', () => {
        it('should remove inline script tags', () => {
            const input = '<script>alert("xss")</script>Hello'
            expect(sanitizeHtml(input)).toBe('Hello')
        })

        it('should remove script tags with attributes', () => {
            const input = '<script type="text/javascript">malicious()</script>Safe'
            expect(sanitizeHtml(input)).toBe('Safe')
        })

        it('should remove multiple script tags', () => {
            const input = '<script>a</script>Text<script>b</script>'
            expect(sanitizeHtml(input)).toBe('Text')
        })
    })

    describe('HTML tag removal', () => {
        it('should remove simple HTML tags', () => {
            const input = '<p>Paragraph</p>'
            expect(sanitizeHtml(input)).toBe('Paragraph')
        })

        it('should remove nested tags', () => {
            const input = '<div><span>Nested</span></div>'
            expect(sanitizeHtml(input)).toBe('Nested')
        })

        it('should remove self-closing tags', () => {
            const input = 'Before<br/>After'
            expect(sanitizeHtml(input)).toBe('BeforeAfter')
        })

        it('should remove anchor tags', () => {
            const input = '<a href="javascript:alert()">Click</a>'
            expect(sanitizeHtml(input)).toBe('Click')
        })

        it('should remove style tags', () => {
            const input = '<style>body{display:none}</style>Content'
            expect(sanitizeHtml(input)).toBe('Content')
        })
    })

    describe('edge cases', () => {
        it('should handle empty string', () => {
            expect(sanitizeHtml('')).toBe('')
        })

        it('should handle null/undefined', () => {
            expect(sanitizeHtml(null as unknown as string)).toBe('')
            expect(sanitizeHtml(undefined as unknown as string)).toBe('')
        })

        it('should preserve plain text', () => {
            const input = 'This is plain text without HTML'
            expect(sanitizeHtml(input)).toBe('This is plain text without HTML')
        })

        it('should normalize whitespace', () => {
            const input = '  Multiple   spaces   here  '
            expect(sanitizeHtml(input)).toBe('Multiple spaces here')
        })

        it('should decode HTML entities', () => {
            const input = '&lt;script&gt;test&lt;/script&gt;'
            expect(sanitizeHtml(input)).toBe('<script>test</script>')
        })
    })

    describe('Norwegian text handling', () => {
        it('should preserve Norwegian special characters', () => {
            const input = 'Æøå ÆØÅ er norske bokstaver'
            expect(sanitizeHtml(input)).toBe('Æøå ÆØÅ er norske bokstaver')
        })

        it('should sanitize while preserving Norwegian text', () => {
            const input = '<p>Hei på deg!</p><script>ondsinnet()</script>'
            expect(sanitizeHtml(input)).toBe('Hei på deg!')
        })
    })
})

describe('escapeHtml', () => {
    it('should escape angle brackets', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    })

    it('should escape ampersands', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    it('should escape quotes', () => {
        expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;')
    })

    it('should escape single quotes', () => {
        expect(escapeHtml("it's")).toBe("it&#x27;s")
    })

    it('should handle empty input', () => {
        expect(escapeHtml('')).toBe('')
        expect(escapeHtml(null as unknown as string)).toBe('')
    })
})
