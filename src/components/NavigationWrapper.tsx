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

  const protectedPrefixes = [
    '/dashboard',
    '/search',
    '/account',
    '/billing',
    '/feedback',
    '/admin'
  ]
  
  const shouldShowSidebar = isLoggedIn && protectedPrefixes.some(prefix => pathname.startsWith(prefix))

  if (shouldShowSidebar) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <Sidebar account={account} />
        <div className="lg:pl-64">
          <main className="p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // --- PUBLIC LAYOUT ---
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  )
}