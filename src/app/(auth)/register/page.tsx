'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/pocketbase'
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Loader2 
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.passwordConfirm) {
      setError("Access keys do not match.")
      setLoading(false)
      return
    }

    try {
      // Derive a temporary name from email since the design doesn't have a name field
      // You can change this later in settings
      const derivedName = formData.email.split('@')[0]
      
      await signUp(formData.email, formData.password, derivedName)
      
      // Redirect to dashboard on success
      router.push('/register/success')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Onboarding failed. Please try again.')
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
          <div className="flex items-center gap-2 text-blue-600 mb-16">
            <div className="bg-blue-600 rounded p-1">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">DILIGUARD</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md w-full">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900 mb-3 uppercase">
            Request <br /> Onboarding
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-12">
            Create an authorized master account for Diliguard audits.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Master Identity Email
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
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Define Access Key
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Confirm Access Key
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({...formData, passwordConfirm: e.target.value})}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 mt-8"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Create Audit Profile <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Footer Links */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                Already Enrolled?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Enter Hub
                </Link>
              </div>
              
              <Link href="/" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </Link>
            </div>

          </form>
        </div>

        {/* Bottom Metadata */}
        <div className="flex gap-8 mt-12">
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">Verified Infrastructure</span>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">Cloud Native</span>
        </div>

      </div>

      {/* RIGHT COLUMN: Visuals */}
      <div className="hidden lg:block relative bg-gray-900 overflow-hidden">
        {/* Tech Texture Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-screen"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop')`,
            filter: 'grayscale(100%) contrast(120%)'
          }}
        />
        
        {/* Gradient Fade Overlay (White to Transparent) - Simulates the image fading out to the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent z-10" />
        
        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 right-0 p-16 z-20">
          <div className="inline-block px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[10px] font-bold tracking-widest text-white uppercase mb-6">
            Onboarding Protocol
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white max-w-xl leading-tight">
            JOIN THE ELITE NETWORK OF <br/>
            RISK INTELLIGENCE ANALYSTS.
          </h2>
        </div>
      </div>

    </div>
  )
}