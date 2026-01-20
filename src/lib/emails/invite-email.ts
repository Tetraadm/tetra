export function generateInviteHtml(inviteUrl: string, role: string, inviterName: string = 'En administrator') {
  const brandColor = '#4F46E5';
  const logoUrl = 'https://tetrivo.com/tetrivo-logo.png';
  const previewText = `${inviterName} har invitert deg til Tetrivo HMS.`;

  return `
<!DOCTYPE html>
<html lang="no" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Invitasjon til Tetrivo HMS</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    table, td, div, h1, p { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
    @media screen and (max-width: 530px) {
      .unsub { display: block; padding: 8px; margin-top: 14px; border-radius: 6px; background-color: #f5f5f5; text-decoration: none !important; font-weight: bold; }
      .col-lge { max-width: 100% !important; }
    }
    @media (prefers-color-scheme: dark) {
      body { background-color: #111827 !important; }
      .email-container { background-color: #1f2937 !important; color: #f3f4f6 !important; }
      .header-bg { background-color: #111827 !important; }
      h1, h2, h3, p, span { color: #f3f4f6 !important; }
      .role-badge { background-color: #374151 !important; color: #818cf8 !important; }
      .footer-text { color: #9ca3af !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#f3f4f6;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText}
  </div>

  <div role="article" aria-roledescription="email" lang="no" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#f3f4f6;">
    <table role="presentation" style="width:100%;border:none;border-spacing:0;">
      <tr>
        <td align="center" style="padding:20px 0;">
          <!--[if mso]>
          <table role="presentation" align="center" style="width:600px;">
          <tr>
          <td>
          <![endif]-->
          <div class="email-container" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div class="header-bg" style="background-color:#1f2937;padding:30px 40px;text-align:center;">
              <img src="${logoUrl}" width="120" alt="Tetrivo HMS" style="width:120px;max-width:100%;height:auto;border:none;display:block;margin:0 auto;">
            </div>

            <!-- Content -->
            <div style="padding:40px 40px;text-align:left;">
              <h1 style="margin:0 0 20px 0;font-size:24px;line-height:32px;font-weight:bold;color:#111827;">Velkommen til Tetrivo HMS</h1>
              
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#374151;">Hei,</p>
              
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#374151;">
                <strong>${inviterName}</strong> har invitert deg til å bli med i organisasjonen i Tetrivo HMS – systemet for enkel og effektiv HMS-håndtering.
              </p>

              <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#374151;">
                Din rolle: <span class="role-badge" style="background-color:#e0e7ff;color:#4338ca;padding:4px 8px;border-radius:4px;font-weight:600;font-size:14px;display:inline-block;">${role}</span>
              </p>

              <!-- Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${inviteUrl}" style="background-color:${brandColor};color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;mso-padding-alt:0;text-underline-color:${brandColor};">
                  <!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%;mso-text-raise:30pt">&nbsp;</i><![endif]-->
                  <span style="mso-text-raise:15pt;">Aksepter invitasjon</span>
                  <!--[if mso]><i style="letter-spacing: 25px;mso-font-width:-100%">&nbsp;</i><![endif]-->
                </a>
              </div>

              <p style="margin:0;font-size:14px;line-height:20px;color:#6b7280;">
                Denne lenken er gyldig i 7 dager. Hvis du ikke har bedt om denne invitasjonen, kan du trygt se bort fra denne e-posten.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p class="footer-text" style="margin:0;font-size:12px;line-height:16px;color:#6b7280;">
                &copy; ${new Date().getFullYear()} Tetrivo HMS. Alle rettigheter forbeholdt.<br>
                <a href="https://tetrivo.com" style="color:${brandColor};text-decoration:underline;">tetrivo.com</a>
              </p>
            </div>
          </div>
          <!--[if mso]>
          </td>
          </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}
