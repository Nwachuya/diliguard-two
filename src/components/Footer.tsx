'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="absolute bottom-0 w-full border-t border-gray-100 bg-white py-6 z-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* --- LEFT: "N" Circle --- */}
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          N
        </div>

        {/* --- CENTER: Brand and Links --- */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1 rounded-md">
              <ShieldCheck className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-gray-900 uppercase">
              Diliguard
            </span>
          </Link>
          
          <div className="hidden md:block h-4 w-px bg-gray-200" />

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:support@diliguard.com" className="hover:text-gray-900 transition-colors">
              System Support
            </a>
          </div>
        </div>

        {/* --- RIGHT: Copyright --- */}
        <div className="text-[10px] font-medium text-gray-400 text-right flex-shrink-0">
          © {currentYear} Diliguard Security.
        </div>
        
      </div>
    </footer>
  )
}