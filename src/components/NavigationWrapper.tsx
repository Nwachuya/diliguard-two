'use client'

import { useEffect, useState } from 'react'
import pb, { getAccount } from '@/lib/pocketbase'
import { AccountWithUser } from '@/types'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
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

  // Prevent layout shift
  if (loading) return null

  // --- LOGGED IN LAYOUT ---
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        <Sidebar account={account} />
        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // --- PUBLIC LAYOUT ---
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}