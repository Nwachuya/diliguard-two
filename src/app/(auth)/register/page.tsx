'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/pocketbase'
import { 
  Mail, 
  Lock, 
  User,
  ArrowRight, 
  ArrowLeft,
  Loader2 
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
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
      await signUp(formData.email, formData.password, formData.name)
      router.push('/validate')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Onboarding failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      setError("Please fill out both name and email.")
      return
    }
    setError('')
    setStep(2)
  }

  return (
    // ADDED flex-1 HERE
    <div className="w-full grid lg:grid-cols-2 flex-1">
      
      {/* LEFT COLUMN: Form */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 pt-40 pb-24">
        
        <div className="max-w-md w-full">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900 mb-3 uppercase">
            Request <br /> Onboarding
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-12">
            Create an authorized master account for Diliguard audits.
          </p>

          <form onSubmit={step === 1 ? handleNextStep : handleSubmit}>
            
            <div className="flex justify-end mb-4">
                <span className="text-xs font-bold text-gray-400">Step {step} of 2</span>
            </div>
            
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded mb-6">
                {error}
              </div>
            )}
            
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Identity Name
                  </label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                      <User className="h-5 w-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

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
                
                <button
                  type="submit"
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 mt-8"
                >
                  Next Step <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-500">
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
                      autoFocus
                      placeholder="••••••••"
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
                
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 mt-8"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create Audit Profile <ArrowRight className="h-4 w-4" /></>}
                </button>
                
                <div className="flex justify-center pt-2">
                  <button type="button" onClick={() => setStep(1)} className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-colors">
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                </div>
              </div>
            )}
            
            <div className="text-center pt-8">
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                Already Enrolled?{' '}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Enter Hub
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Visuals */}
      <div className="hidden lg:block relative bg-gray-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-screen"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop')`,
            filter: 'grayscale(100%) contrast(120%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent z-10" />
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