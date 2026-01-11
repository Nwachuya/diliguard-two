'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import pb from '@/lib/pocketbase'
import { ShieldCheck, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    setIsLoggedIn(pb.authStore.isValid)
    
    return pb.authStore.onChange(() => {
      setIsLoggedIn(pb.authStore.isValid)
    })
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 uppercase group-hover:text-gray-700 transition-colors">
            Diliguard
          </span>
        </Link>
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-3 items-center">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-blue-700 transition shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="bg-white text-gray-700 px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide border border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition shadow-sm"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-white hover:text-blue-600 border border-blue-600 transition shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold text-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-white text-gray-700 py-3 rounded-lg font-bold text-sm border border-gray-200"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}