'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-gray-100 bg-white py-8 z-10 relative">
      {/* 
         MATCHED PADDING: px-6 sm:px-12 lg:px-16 xl:px-24 
         Removed max-w-7xl to allow alignment with the split-screen edge
      */}
      <div className="w-full px-6 sm:px-12 lg:px-16 xl:px-24 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Side: Brand Logo aligned with body text */}
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={3} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900 uppercase">
            Diliguard
          </span>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
          <Link href="/privacy" className="hover:text-blue-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-blue-600 transition-colors">
            Terms of Service
          </Link>
          <a href="mailto:support@diliguard.com" className="hover:text-blue-600 transition-colors">
            System Support
          </a>
        </div>

        {/* Right Side: Copyright */}
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
          © {currentYear} Diliguard Security
        </div>
        
      </div>
    </footer>
  )
}