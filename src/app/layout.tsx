import type { Metadata } from 'next'
import Link from 'next/link'
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
      <body className="min-h-screen flex flex-col font-sans">
        {/* Simple Navigation for Testing */}
        <nav className="border-b border-gray-200 bg-white p-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="text-xl font-bold text-blue-600">
              <Link href="/">Diliguard</Link>
            </div>
            
            <div className="flex gap-6 text-sm font-medium text-gray-600">
              <Link href="/dashboard" className="hover:text-black">
                Dashboard
              </Link>
              <Link href="/search/new" className="hover:text-black">
                Search
              </Link>
              <Link href="/login" className="hover:text-black">
                Login
              </Link>
              <Link href="/register" className="hover:text-black">
                Register
              </Link>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </body>
    </html>
  )
}