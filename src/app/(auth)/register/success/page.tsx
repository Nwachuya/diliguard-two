'use client'

import Link from 'next/link'
import { ShieldCheck, Mail } from 'lucide-react'

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white p-6 font-sans">
        
        <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="mx-auto bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
                <ShieldCheck className="h-10 w-10 text-blue-600" />
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase mb-4">
                Application Received
            </h1>

            {/* Description */}
            <p className="text-gray-500 mb-8 leading-relaxed">
                Your account profile has been created with status <strong className="text-gray-900">NEW</strong>. 
                Please verify your identity via the secure link sent to your inbox to activate your access key.
            </p>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-8 flex items-start gap-3 text-left">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1">Verification Required</p>
                    <p className="text-xs text-gray-500">You must click the link in your email before you can log in to the dashboard.</p>
                </div>
            </div>

            {/* Button */}
            <Link 
                href="/login" 
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-900/10"
            >
                Proceed to Login
            </Link>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-[10px] font-bold tracking-widest text-gray-300 uppercase">
            Diliguard Security Protocol
        </div>
    </div>
  )
}
