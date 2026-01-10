'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/pocketbase'
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Loader2 
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(formData.email, formData.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Connection refused: Invalid identity or access protocol.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full grid lg:grid-cols-2 flex-1">
      
      <div className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16 xl:px-24 pt-40 pb-24">
        
        <div className="max-w-md w-full">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-gray-900 mb-3 uppercase">
            Initialize <br /> Session
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-12">
            Portal access required to monitor active scans.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded uppercase tracking-wide">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Identity Endpoint
              </label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Access Protocol
                </label>
                <Link 
                  href="/reset-password" 
                  className="text-[10px] font-bold tracking-widest text-blue-600 hover:text-blue-800 uppercase"
                >
                  Key Loss?
                </Link>
              </div>
              
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 mt-8"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Initialize Connection <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-4">
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                No Access Key?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 transition-colors">
                  Register Device
                </Link>
              </div>
              
              <Link href="/" className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back
              </Link>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden lg:block relative bg-gray-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto-format&fit=crop')`,
            filter: 'grayscale(30%) contrast(110%) brightness(70%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 opacity-100" />
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute bottom-0 left-0 right-0 p-16 z-20 flex flex-col items-end text-right">
          <div className="inline-block px-3 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-[10px] font-bold tracking-widest text-white/80 uppercase mb-6">
            Identity Assurance Matrix
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white max-w-xl leading-tight">
            SECURING GLOBAL RISK INTELLIGENCE THROUGH PRECISION HARVESTING.
          </h2>
        </div>
      </div>
    </div>
  )
}