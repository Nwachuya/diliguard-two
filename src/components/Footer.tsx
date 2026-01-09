'use client'

import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white py-12 z-10 relative">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-1 rounded-md">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900 uppercase">
            Diliguard
          </span>
        </div>

        {/* Center: Links */}
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

        {/* Right: Copyright */}
        <div className="text-[10px] font-medium text-gray-400">
          © {currentYear} Diliguard Security.
        </div>
        
      </div>
    </footer>
  )
}