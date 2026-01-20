import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

export async function POST(request: Request) {
    try {
        const { name, company, email, subject, message } = await request.json()

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

        // Build email content
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
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
        </tr>
        ${company ? `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Bedrift:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${company}</td>
        </tr>
        ` : ''}
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">E-post:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
        </tr>
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Emne:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${subject}</td>
        </tr>
    </table>
    
    <h3 style="margin-top: 24px; margin-bottom: 12px;">Melding:</h3>
    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
    
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

        console.log(`CONTACT: Email sent from ${email} - Subject: ${subject}`)

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('CONTACT_ERROR:', error)
        return NextResponse.json(
            { error: 'Kunne ikke sende henvendelsen. Prøv igjen senere.' },
            { status: 500 }
        )
    }
}
