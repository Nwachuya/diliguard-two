'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount } from '@/lib/pocketbase'
import { AccountWithUser } from '@/types'
import Sidebar from './Sidebar'

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

  // If loading, render a simple shell to prevent layout shift
  if (loading) return null

  // --- 1. LOGGED IN LAYOUT (Sidebar) ---
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50/30">
        {/* The Sidebar takes care of itself (fixed position) */}
        <Sidebar account={account} />
        
        {/* We push the content over 64 units (16rem) to make room for the sidebar */}
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-8">
            {children}
          </main>
        </div>
      </div>
    )
  }

  // --- 2. LOGGED OUT LAYOUT (Navbar) ---
  // Simple navbar for landing page / login / register
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="border-b border-gray-200 bg-white p-4 shadow-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between w-full">
          <div className="text-xl font-bold text-blue-600">
            <Link href="/">Diliguard</Link>
          </div>
          <div className="flex gap-4 text-sm font-medium items-center">
            <Link href="/login" className="text-gray-600 hover:text-black">
              Login
            </Link>
            <Link href="/register" className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}