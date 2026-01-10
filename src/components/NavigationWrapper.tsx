'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import pb, { getAccount } from '@/lib/pocketbase'
import { AccountWithUser } from '@/types'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const valid = pb.authStore.isValid
      const user = pb.authStore.model
      
      setIsLoggedIn(valid)

      if (valid && user) {
        try {
          const acc = await getAccount(user.id)
          setAccount(acc)
        } catch (error) {
          console.error("Failed to fetch account", error)
        }
      }
      setLoading(false)
    }

    checkAuth()
    return pb.authStore.onChange(checkAuth)
  }, [])

  if (loading) return null

  const publicPaths = ['/', '/validate', '/login', '/register', '/reset-password', '/privacy', '/terms']
  const isPublicPage = publicPaths.some(path => pathname === path)
  
  const shouldShowSidebar = isLoggedIn && !isPublicPage

  if (shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <Sidebar account={account} />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // --- CORRECTED PUBLIC LAYOUT ---
  return (
    // This container acts as the positioning context for the absolute Navbar and Footer
    <div className="relative min-h-screen bg-white">
      <Navbar />
      
      {/* The main content area where the page itself will render */}
      <main>
        {children}
      </main>

      <Footer />
    </div>
  )
}