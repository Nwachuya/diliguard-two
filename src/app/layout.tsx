import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Diliguard',
  description: 'Due diligence search platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Add suppressHydrationWarning here 👇
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}