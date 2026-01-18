import './globals.css'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from '@/components/OfflineBanner'
import { ThemeProvider } from '@/components/theme-provider'
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="no" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
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