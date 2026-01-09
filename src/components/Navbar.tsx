'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import pb from '@/lib/pocketbase'
import { ShieldCheck, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    // Check initial state
    setIsLoggedIn(pb.authStore.isValid)
    
    // Listen for changes (login/logout)
    return pb.authStore.onChange(() => {
      setIsLoggedIn(pb.authStore.isValid)
    })
  }, [])

  return (
    <nav className="absolute top-0 w-full z-50 p-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* LOGO SECTION - Matches your screenshot */}
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          {/* Blue Icon Box */}
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          {/* Text */}
          <span className="text-xl font-extrabold tracking-tight text-gray-900 uppercase group-hover:text-gray-700 transition-colors">
            Diliguard
          </span>
        </Link>
        
        {/* Right Side Buttons (Desktop) */}
        <div className="hidden md:flex gap-4 text-sm font-medium items-center">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-black font-bold tracking-wide text-xs uppercase">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold tracking-wide text-xs uppercase hover:bg-blue-700 transition shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-900">
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg p-4 md:hidden flex flex-col gap-4">
           {isLoggedIn ? (
              <Link href="/dashboard" className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold">
                Dashboard
              </Link>
           ) : (
             <>
               <Link href="/login" className="block w-full text-center py-3 font-bold text-gray-600">
                 Sign In
               </Link>
               <Link href="/register" className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold">
                 Get Started
               </Link>
             </>
           )}
        </div>
      )}
    </nav>
  )
}