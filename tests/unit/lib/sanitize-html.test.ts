import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripHtml, escapeHtml } from '@/lib/sanitize-html'

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

    describe('safe HTML tag preservation', () => {
        it('should preserve paragraph tags', () => {
            const input = '<p>Paragraph</p>'
            expect(sanitizeHtml(input)).toBe('<p>Paragraph</p>')
        })

        it('should preserve nested safe tags', () => {
            const input = '<div><span>Nested</span></div>'
            expect(sanitizeHtml(input)).toBe('<div><span>Nested</span></div>')
        })

        it('should preserve line breaks', () => {
            const input = 'Before<br/>After'
            expect(sanitizeHtml(input)).toContain('Before')
            expect(sanitizeHtml(input)).toContain('After')
        })

        it('should preserve formatting tags', () => {
            const input = '<strong>Bold</strong> and <em>italic</em>'
            expect(sanitizeHtml(input)).toBe('<strong>Bold</strong> and <em>italic</em>')
        })

        it('should preserve lists', () => {
            const input = '<ul><li>Item 1</li><li>Item 2</li></ul>'
            expect(sanitizeHtml(input)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>')
        })
    })

    describe('dangerous content removal', () => {
        it('should remove javascript: URLs from anchors', () => {
            const input = '<a href="javascript:alert()">Click</a>'
            const result = sanitizeHtml(input)
            expect(result).not.toContain('javascript:')
            expect(result).toContain('Click')
        })

        it('should remove style tags', () => {
            const input = '<style>body{display:none}</style>Content'
            expect(sanitizeHtml(input)).toBe('Content')
        })

        it('should remove iframe tags', () => {
            const input = '<iframe src="evil.com"></iframe>Safe'
            expect(sanitizeHtml(input)).toBe('Safe')
        })

        it('should remove event handlers', () => {
            const input = '<div onclick="alert()">Click me</div>'
            const result = sanitizeHtml(input)
            expect(result).not.toContain('onclick')
            expect(result).toContain('Click me')
        })
    })

    describe('anchor tag transformation', () => {
        it('should add noopener noreferrer to links', () => {
            const input = '<a href="https://example.com">Link</a>'
            const result = sanitizeHtml(input)
            expect(result).toContain('rel="noopener noreferrer"')
        })

        it('should add target blank to links', () => {
            const input = '<a href="https://example.com">Link</a>'
            const result = sanitizeHtml(input)
            expect(result).toContain('target="_blank"')
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
    })

    describe('Norwegian text handling', () => {
        it('should preserve Norwegian special characters', () => {
            const input = 'Æøå ÆØÅ er norske bokstaver'
            expect(sanitizeHtml(input)).toBe('Æøå ÆØÅ er norske bokstaver')
        })

        it('should sanitize while preserving Norwegian text', () => {
            const input = '<p>Hei på deg!</p><script>ondsinnet()</script>'
            expect(sanitizeHtml(input)).toBe('<p>Hei på deg!</p>')
        })
    })
})

describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
        const input = '<p>Paragraph</p>'
        expect(stripHtml(input)).toBe('Paragraph')
    })

    it('should remove nested tags', () => {
        const input = '<div><span>Nested</span></div>'
        expect(stripHtml(input)).toBe('Nested')
    })

    it('should remove all formatting', () => {
        const input = '<strong>Bold</strong> and <em>italic</em>'
        expect(stripHtml(input)).toBe('Bold and italic')
    })

    it('should handle script tags', () => {
        const input = '<script>evil()</script>Safe text'
        expect(stripHtml(input)).toBe('Safe text')
    })

    it('should preserve Norwegian characters', () => {
        const input = '<p>Hei på deg! Æøå</p>'
        expect(stripHtml(input)).toBe('Hei på deg! Æøå')
    })

    it('should handle empty input', () => {
        expect(stripHtml('')).toBe('')
        expect(stripHtml(null as unknown as string)).toBe('')
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
