'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/pocketbase'
import { 
  ShieldCheck, 
  Mail, 
  ArrowLeft, 
  Loader2,
  Info
} from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')

    try {
      await resetPassword(email)
      setStatus('success')
    } catch (err: any) {
      console.error(err)
      setStatus('error')
      setErrorMessage('Identity verification failed. Please check the email provided.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 font-sans bg-white">
      
      {/* LEFT COLUMN: Form */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24">
        
        {/* Header / Logo */}
        <div>
          <Link href="/" className="flex items-center gap-2 text-blue-600 mb-16 w-fit">
            <div className="bg-blue-600 rounded p-1">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">DILIGUARD</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="max-w-md w-full">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900 mb-3 uppercase">
            Override <br /> Required
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-8">
            Secure recovery protocol for forgotten access keys.
          </p>

          {/* Info Alert Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex gap-3 items-start">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-blue-800 leading-relaxed uppercase tracking-wide">
              Identity verification required. Enter your registered email to receive access instructions.
            </p>
          </div>

          {status === 'success' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-800 text-xs font-bold uppercase tracking-wide text-center">
                Recovery Token Dispatched. Check your inbox.
              </div>
              <Link 
                href="/login"
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded uppercase tracking-wide">
                  {errorMessage}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Identification Email
                </label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@organization.com"
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Dispatch Recovery Token'
                )}
              </button>

              {/* Cancel Link */}
              <div className="flex justify-center pt-2">
                <Link href="/login" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
                  <ArrowLeft className="h-3 w-3" /> Cancel Recovery
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Metadata */}
        <div className="flex gap-8 mt-12">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-200 uppercase">Recovery Link Sent</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-200 uppercase">Manual Override</span>
        </div>

      </div>

      {/* RIGHT COLUMN: Visuals */}
      <div className="hidden lg:block relative bg-[#0B1120] overflow-hidden">
        {/* Background Gradient/Mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2333] to-[#050914]" />
        
        {/* Texture Overlay (Optional - usually adds that 'grainy' look) */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* The "Fade" from white to dark */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/5 to-transparent z-10 w-1/3" />
        
        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-16 z-20 flex flex-col items-end text-right">
          <div className="inline-block px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-bold tracking-widest text-white/80 uppercase mb-6">
            Security Override
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white max-w-xl leading-tight">
            ADVANCED CRYPTOGRAPHIC RECOVERY FOR YOUR DILIGUARD AUDIT HISTORY.
          </h2>
        </div>
      </div>

    </div>
  )
}