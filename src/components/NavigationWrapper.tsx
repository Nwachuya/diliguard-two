'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import pb, { getAccount } from '@/lib/pocketbase'
import { AccountWithUser } from '@/types'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() // <--- This allows us to check the current URL
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

  // --- LOGIC: WHEN TO SHOW SIDEBAR ---
  // 1. Must be logged in
  // 2. Must NOT be the Homepage ('/')
  // 3. Must NOT be the Validation page ('/validate')
  const shouldShowSidebar = isLoggedIn && pathname !== '/' && pathname !== '/validate'

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

  // --- PUBLIC LAYOUT (Navbar) ---
  // Used for: Home, Login, Register, Validate, or Logged Out users
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
