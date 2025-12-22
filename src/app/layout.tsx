import './globals.css'

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
    <html lang="no">
      <body>{children}</body>
    </html>
  )
}