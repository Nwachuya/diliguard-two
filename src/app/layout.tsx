import type { Metadata } from 'next'
import NavigationWrapper from '@/components/NavigationWrapper'
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
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-gray-900 antialiased">
        <NavigationWrapper>
            {children}
        </NavigationWrapper>
      </body>
    </html>
  )
}