'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getPaymentList } from '@/lib/pocketbase'
import type { AccountWithUser, Payment } from '@/types'
import { Loader2, Copy, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadData() {
      const user = pb.authStore.model
      if (!user) { 
        router.push('/login') 
        return
      }

      try {
        const acc = await getAccount(user.id)
        setAccount(acc)
        
        if (acc) {
          // Only fetch 3 payments for preview
          const pays = await getPaymentList(acc.id, 1, 3)
          setPayments(pays.items || [])
        }
      } catch (e) {
        console.error("Failed to load account data", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleCopyKey = () => {
    if (account?.key) {
      navigator.clipboard.writeText(account.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Safe access to nested user data
  const userData = account?.expand?.user
  
  // Get avatar URL if available
  const getAvatarUrl = () => {
    if (userData?.avatar) {
      return pb.files.getUrl(userData, userData.avatar)
    }
    return null
  }

  // Safe helper to get initial
  const getInitial = () => {
    if (userData?.name && userData.name.length > 0) return userData.name[0].toUpperCase()
    if (userData?.email && userData.email.length > 0) return userData.email[0].toUpperCase()
    return 'U'
  }

  // Calculate usage percentage safely (capped at 100%)
  const usageCount = account?.monthly_usage || 0
  const usageLimit = 100 
  const usagePercent = Math.min((usageCount / usageLimit) * 100, 100)

  // Check if user is on the highest plan (Pro)
  const isPro = account?.plan_name?.toLowerCase() === 'pro'

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading Settings...
      </div>
    )
  }

  const avatarUrl = getAvatarUrl()

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and subscription.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Profile & API */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Profile Section */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 mb-6 uppercase tracking-wider">Profile Identity</h2>
            <div className="flex items-center gap-6">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="h-20 w-20 rounded-full object-cover flex-shrink-0 shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 shadow-lg shadow-blue-600/20">
                  {getInitial()}
                </div>
              )}
              <div className="space-y-1 overflow-hidden">
                <p className="font-bold text-2xl text-gray-900 truncate">
                  {userData?.name || 'User'}
                </p>
                <p className="text-gray-500 truncate font-medium">{userData?.email}</p>
                <div className="pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                    userData?.verified ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {userData?.verified ? 'Verified Identity' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Developer Access Key</h2>
            <p className="text-sm text-gray-500 mb-6">
                Your unique API key for accessing the Diliguard API programmatically. Do not share this key.
            </p>
            
            <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className={`w-full bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-sm text-gray-700 h-11 flex items-center transition-all ${showKey ? 'tracking-normal' : 'tracking-widest'}`}>
                      {showKey ? account?.key : `dlg_${'•'.repeat(24)}`}
                  </div>
                </div>
                
                <button 
                    onClick={() => setShowKey(!showKey)}
                    className="px-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition flex items-center justify-center w-11"
                    title={showKey ? "Hide Key" : "Show Key"}
                >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                
                <button 
                    onClick={handleCopyKey}
                    className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium min-w-[100px] justify-center"
                >
                    {copied ? (
                      <span className="text-white">Copied!</span>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy
                      </>
                    )}
                </button>
            </div>
          </section>

          {/* Billing History - Max 3 items */}
          <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction History</h2>
              <Link 
                href="/billing" 
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {payments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No invoices found.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center py-4 hover:bg-gray-50/50 px-2 -mx-2 rounded transition-colors">
                            <div>
                                <p className="font-medium text-gray-900">
                                  Invoice #{payment.stripe_id ? payment.stripe_id.slice(-8).toUpperCase() : '---'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {payment.created ? new Date(payment.created).toLocaleDateString() : 'Unknown Date'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-gray-900">
                                    {payment.amount ? (payment.amount / 100).toFixed(2) : '0.00'} {payment.currency ? payment.currency.toUpperCase() : 'USD'}
                                </p>
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                  payment.status === 'succeeded' || payment.status === 'paid' ? 'text-green-600' : 'text-gray-400'
                                }`}>
                                  {payment.status || 'unknown'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </section>
        </div>

        {/* Right Column: Subscription Status */}
        <div className="space-y-6">
            <section className="bg-[#0B1120] text-white p-6 rounded-xl shadow-xl relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 p-32 bg-blue-600 opacity-10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>
                
                <h2 className="text-xs font-bold text-blue-200 mb-2 uppercase tracking-widest">Active Plan</h2>
                <div className="text-3xl font-extrabold mb-6 capitalize tracking-tight">
                  {account?.plan_name || 'Free Tier'}
                </div>
                
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 text-gray-400">
                        <span>Monthly Usage</span>
                        <span className="font-medium text-white">{usageCount} <span className="text-gray-500">/ {usageLimit}</span></span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                            style={{ width: `${usagePercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-3 font-medium uppercase tracking-wider">Resets next month</p>
                </div>

                {!isPro && (
                  <Link 
                    href="/choose-plan"
                    className="block w-full py-3 bg-white text-black rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition shadow-lg shadow-white/5 text-center"
                  >
                    Upgrade Plan
                  </Link>
                )}
            </section>
            
            {account?.role === 'admin' && (
                <section className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2 text-sm uppercase tracking-wide">Admin Privileges</h3>
                    <p className="text-xs text-amber-700 mb-4">You have elevated permissions on this platform.</p>
                    <Link href="/admin" className="text-xs font-bold text-amber-900 hover:text-amber-700 flex items-center gap-1 uppercase tracking-widest">
                        Enter Admin Panel &rarr;
                    </Link>
                </section>
            )}
        </div>
      </div>
    </div>
  )
}