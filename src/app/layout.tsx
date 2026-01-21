import './globals.css'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from '@/components/OfflineBanner'
import { ThemeProvider } from '@/components/theme-provider'
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-serif',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Tetrivo',
  description: 'Digital sikkerhet og instruksjonsverktøy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body className={`${plexSans.variable} ${plexSerif.variable} ${plexMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <OfflineBanner />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: 'var(--surface)',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: 'var(--surface)',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
