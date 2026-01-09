'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// Ensure these are exported from your @/lib/pocketbase file
import pb, { getAccount, getPaymentList, signOut } from '@/lib/pocketbase'
import type { AccountWithUser, Payment } from '@/types'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    async function loadData() {
      // 1. Check Auth
      const user = pb.authStore.model
      if (!user) { 
        router.push('/login') 
        return
      }

      try {
        // 2. Fetch Account
        const acc = await getAccount(user.id)
        setAccount(acc)
        
        if (acc) {
          // 3. Fetch Payments
          // Ensure getPaymentList returns { items: Payment[] }
          const pays = await getPaymentList(acc.id)
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

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Safe access to nested user data
  const userData = account?.expand?.user
  
  // Safe helper to get initial
  const getInitial = () => {
    if (userData?.name && userData.name.length > 0) return userData.name[0].toUpperCase()
    if (userData?.email && userData.email.length > 0) return userData.email[0].toUpperCase()
    return 'U'
  }

  // Calculate usage percentage safely (capped at 100%)
  const usageCount = account?.monthly_usage || 0
  const usageLimit = 100 // Replace with dynamic limit if available
  const usagePercent = Math.min((usageCount / usageLimit) * 100, 100)

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-gray-500">Loading Account Settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <button 
          onClick={handleSignOut} 
          className="text-sm text-red-600 font-medium hover:bg-red-50 px-4 py-2 rounded-lg transition border border-red-100"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left Column: Profile & API */}
        <div className="space-y-8 md:col-span-2">
          
          {/* Profile Section */}
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            <div className="flex items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-600 flex-shrink-0">
                {getInitial()}
              </div>
              <div className="space-y-1 overflow-hidden">
                <p className="font-bold text-xl text-gray-900 truncate">{userData?.name || 'User'}</p>
                <p className="text-gray-500 truncate">{userData?.email}</p>
                <div className="pt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userData?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {userData?.verified ? 'Email Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* API Key Section */}
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Developer API Key</h2>
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">Role: {account?.role || 'user'}</div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
                Your unique API key for accessing the Diliguard API programmatically. Keep this secret.
            </p>
            <div className="flex gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-lg font-mono text-sm text-gray-700 truncate min-w-0">
                    {showKey ? account?.key : `dlg_${'*'.repeat(24)}`}
                </div>
                <button 
                    onClick={() => setShowKey(!showKey)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition shrink-0"
                >
                    {showKey ? 'Hide' : 'Show'}
                </button>
                <button 
                    onClick={() => {
                        if (account?.key) navigator.clipboard.writeText(account.key)
                    }}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition shrink-0"
                >
                    Copy
                </button>
            </div>
          </section>

          {/* Billing History */}
          <section className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
            {payments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-sm">No invoices found.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center py-4">
                            <div>
                                <p className="font-medium text-gray-900">
                                  Invoice #{payment.stripe_id ? payment.stripe_id.slice(-8).toUpperCase() : '---'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {payment.created ? new Date(payment.created).toLocaleDateString() : 'Unknown Date'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-medium text-gray-900">
                                    {payment.amount ? (payment.amount / 100).toFixed(2) : '0.00'} {payment.currency ? payment.currency.toUpperCase() : 'USD'}
                                </p>
                                <span className="text-xs uppercase font-bold text-gray-400">
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
        <div className="space-y-8">
            <section className="bg-gray-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"></div>
                
                <h2 className="text-lg font-semibold text-gray-200 mb-1">Current Plan</h2>
                <div className="text-3xl font-bold mb-6 capitalize">{account?.subscription_status || 'Free Tier'}</div>
                
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2 text-gray-300">
                        <span>Monthly Usage</span>
                        <span className="font-medium text-white">{usageCount} searches</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                            style={{ width: `${usagePercent}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Resets next month</p>
                </div>

                <button className="w-full py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition">
                    Upgrade Plan
                </button>
            </section>
            
            {account?.role === 'admin' && (
                <section className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                    <h3 className="font-bold text-amber-800 mb-2">Admin Access</h3>
                    <p className="text-sm text-amber-700 mb-4">You have administrator privileges on this platform.</p>
                    {/* Note: Link import is handled by Next.js automatically usually, but let's be implicit if needed */}
                    <a href="/admin" className="text-sm font-medium text-amber-900 hover:underline">
                        Go to Admin Panel &rarr;
                    </a>
                </section>
            )}
        </div>
      </div>
    </div>
  )
}