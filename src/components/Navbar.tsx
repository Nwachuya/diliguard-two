'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import pb from '@/lib/pocketbase'
import { ShieldCheck } from 'lucide-react'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  useEffect(() => {
    setIsLoggedIn(pb.authStore.isValid)
    return pb.authStore.onChange(() => setIsLoggedIn(pb.authStore.isValid))
  }, [])

  return (
    <nav className="absolute top-0 w-full z-50 py-8">
      {/* MATCHED PADDING: px-6 sm:px-12 lg:px-16 xl:px-24 */}
      <div className="w-full px-6 sm:px-12 lg:px-16 xl:px-24 flex items-center justify-between">
        
        {/* LOGO */}
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm group-hover:bg-blue-700 transition-colors">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 uppercase group-hover:text-gray-700 transition-colors">
            Diliguard
          </span>
        </Link>
        
        {/* Actions */}
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <Link 
              href="/dashboard" 
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:brightness-110 transition shadow-sm text-xs uppercase tracking-widest"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-black font-bold tracking-widest text-[10px] uppercase">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold tracking-widest text-xs uppercase hover:bg-blue-700 transition shadow-sm"
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