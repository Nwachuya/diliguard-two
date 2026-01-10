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
          console.error("Failed to fetch account for role", error)
        }
      }
      setLoading(false)
    }

    checkAuth()
    return pb.authStore.onChange(checkAuth)
  }, [])

  if (loading) return null

  const shouldShowSidebar = isLoggedIn && pathname !== '/' && pathname !== '/validate'

  // --- LAYOUT CASE 1: Logged In & In App (Dashboard style) ---
  if (shouldShowSidebar) {
    return (
      <div className="h-screen bg-gray-50/30 flex overflow-hidden"> 
        <Sidebar account={account} /> 
        
        <div className="flex-1 lg:pl-64 flex flex-col h-full overflow-y-auto"> 
          <main className="flex-1 p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // --- LAYOUT CASE 2: Public Pages ---
  // Using h-screen to lock the height and flex-col to push footer to bottom
  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden">
      <Navbar /> 
      
      {/* 
          Main takes flex-1 to push Footer down. 
          overflow-y-auto ensures that if content is long, only this section scrolls, 
          leaving Navbar and Footer visible.
      */}
      <main className="flex-1 flex flex-col overflow-y-auto"> 
        {children}
      </main>

      <Footer />
    </div>
  )
}