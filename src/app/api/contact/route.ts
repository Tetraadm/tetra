import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getClientIp } from '@/lib/ratelimit'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { escapeHtml } from '@/lib/sanitize-html'

// Initialize Resend
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

// Contact-specific rate limiter: 10 requests per hour per IP
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

const contactRatelimit = (UPSTASH_URL && UPSTASH_TOKEN)
    ? new Ratelimit({
        redis: new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }),
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        prefix: 'ratelimit:contact',
    })
    : null

// In-memory rate limit fallback for when Upstash is not configured
// Simple implementation: track IPs with timestamps
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>()
const MEMORY_LIMIT = 10 // requests per hour
const MEMORY_WINDOW = 60 * 60 * 1000 // 1 hour in ms

function checkMemoryRateLimit(ip: string): { success: boolean; remaining: number } {
    const now = Date.now()
    const record = memoryRateLimits.get(ip)

    if (!record || now > record.resetAt) {
        memoryRateLimits.set(ip, { count: 1, resetAt: now + MEMORY_WINDOW })
        return { success: true, remaining: MEMORY_LIMIT - 1 }
    }

    if (record.count >= MEMORY_LIMIT) {
        return { success: false, remaining: 0 }
    }

    record.count++
    return { success: true, remaining: MEMORY_LIMIT - record.count }
}

export async function POST(request: Request) {
    try {
        // Rate limiting check
        const ip = getClientIp(request)

        if (contactRatelimit) {
            // Use Upstash rate limiter
            const { success, remaining, reset } = await contactRatelimit.limit(ip)
            if (!success) {
                return NextResponse.json(
                    { error: 'For mange henvendelser. Prøv igjen senere.' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                        }
                    }
                )
            }
        } else {
            // Fallback to in-memory rate limiter
            const { success, remaining } = checkMemoryRateLimit(ip)
            if (!success) {
                return NextResponse.json(
                    { error: 'For mange henvendelser. Prøv igjen senere.' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Remaining': remaining.toString(),
                        }
                    }
                )
            }
        }

        const { name, company, email, subject, message, website } = await request.json()

        // Honeypot check: if 'website' field is filled, it's likely a bot
        if (website) {
            // Silently accept but don't send (fool bots into thinking it worked)
            return NextResponse.json({ success: true })
        }

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'Vennligst fyll ut alle påkrevde felt' },
                { status: 400 }
            )
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Ugyldig e-postadresse' },
                { status: 400 }
            )
        }

        if (!resend) {
            console.error('CONTACT_ERROR: Resend not configured')
            return NextResponse.json(
                { error: 'E-posttjenesten er ikke konfigurert' },
                { status: 503 }
            )
        }

        // Build email content - F-005: Escape HTML to prevent XSS
        const safeName = escapeHtml(name)
        const safeCompany = company ? escapeHtml(company) : ''
        const safeEmail = escapeHtml(email)
        const safeSubject = escapeHtml(subject)
        const safeMessage = escapeHtml(message)

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ny henvendelse fra tetrivo.com</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #0d9488; margin-bottom: 24px;">Ny henvendelse fra tetrivo.com</h2>
    
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; width: 120px;">Navn:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${safeName}</td>
        </tr>
        ${safeCompany ? `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Bedrift:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${safeCompany}</td>
        </tr>
        ` : ''}
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">E-post:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
        </tr>
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Emne:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${safeSubject}</td>
        </tr>
    </table>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px;">Melding:</h3>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${safeMessage}</div>
    
    <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px;">
        Denne henvendelsen ble sendt via kontaktskjemaet på tetrivo.com.<br>
        Du kan svare direkte til avsender ved å besvare denne e-posten.
    </p>
</body>
</html>
`

        // Send email
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tetrivo <noreply@tetrivo.com>'

        await resend.emails.send({
            from: fromEmail,
            to: ['kontakt@tetrivo.com'],
            replyTo: email,
            subject: `[Kontakt] ${subject}`,
            html: emailHtml
        })

        // F-08: Don't log PII (email) in production logs
        console.log('CONTACT: Email sent. Subject:', subject)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('CONTACT_ERROR:', error)
        return NextResponse.json(
            { error: 'Kunne ikke sende henvendelsen. Prøv igjen senere.' },
            { status: 500 }
        )
    }
}
