'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import pb, { getAccount } from '@/lib/pocketbase'
import { AccountWithUser } from '@/types'

export default function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<'user' | 'admin' | null>(null)
  
  // Run on mount to check auth status
  useEffect(() => {
    async function checkAuth() {
      // Check PocketBase auth store
      const valid = pb.authStore.isValid
      const user = pb.authStore.model
      
      setIsLoggedIn(valid)

      if (valid && user) {
        try {
          // Fetch account to get the role
          const account = await getAccount(user.id)
          setRole(account?.role || 'user')
        } catch (error) {
          console.error("Failed to load account role", error)
        }
      }
    }

    checkAuth()
    
    // Subscribe to auth changes (e.g. if user logs out in another tab)
    return pb.authStore.onChange(() => {
      checkAuth()
    })
  }, [])

  // Dynamic Logo Destination
  const logoDestination = isLoggedIn ? '/dashboard' : '/'

  return (
    <nav className="border-b border-gray-200 bg-white p-4 shadow-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <div className="text-xl font-bold text-blue-600 hover:text-blue-700 transition">
          <Link href={logoDestination}>Diliguard</Link>
        </div>
        
        {/* Navigation Links */}
        <div className="flex gap-6 text-sm font-medium text-gray-600 items-center">
          
          {isLoggedIn ? (
            /* --- LOGGED IN VIEW --- */
            <>
              <NavLink href="/dashboard" active={pathname === '/dashboard'}>
                Dashboard
              </NavLink>
              
              <NavLink href="/search/new" active={pathname.startsWith('/search')}>
                Search
              </NavLink>

              <NavLink href="/billing" active={pathname === '/billing'}>
                Billing
              </NavLink>

              <NavLink href="/account" active={pathname === '/account'}>
                Account
              </NavLink>

              {role === 'admin' && (
                <NavLink href="/admin" active={pathname.startsWith('/admin')} className="text-amber-600">
                  Admin
                </NavLink>
              )}
            </>
          ) : (
            /* --- LOGGED OUT VIEW --- */
            <>
              <NavLink href="/" active={pathname === '/'}>
                Home
              </NavLink>
              
              <NavLink href="/login" active={pathname === '/login'}>
                Login
              </NavLink>
              
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

// Helper component for cleaner links
function NavLink({ href, active, children, className = '' }: { href: string, active: boolean, children: React.ReactNode, className?: string }) {
  return (
    <Link 
      href={href} 
      className={`transition-colors ${active ? 'text-blue-600 font-semibold' : 'hover:text-black'} ${className}`}
    >
      {children}
    </Link>
  )
}