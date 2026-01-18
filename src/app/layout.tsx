import './globals.css'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from '@/components/OfflineBanner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })

export const metadata = {
  title: 'Tetra',
  description: 'Digital sikkerhet og instruksjonsverktøy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider>
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