'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getResearchList } from '@/lib/pocketbase'
import { AccountWithUser, Research, DashboardStats } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [recentResearch, setRecentResearch] = useState<Research[]>([])
  
  // Initialize with safe defaults based on your DashboardStats type
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    pendingSearches: 0,
    completedSearches: 0,
    monthlyUsage: 0,
    usageLimit: 100 // Hardcoded limit for now, or derive from subscription status
  })

  useEffect(() => {
    async function loadDashboard() {
      const user = pb.authStore.model
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // 1. Fetch Account
        const acc = await getAccount(user.id)
        setAccount(acc)

        if (acc) {
          // 2. Fetch Recent Research (First page, 5 items)
          // The API helper returns { items, totalItems }
          const res = await getResearchList(acc.id, 1, 5) 
          setRecentResearch(res.items)

          // 3. Update Stats
          // Note: To get exact counts of 'Pending' vs 'Complete' server-side, 
          // we would need specific filter queries. For this demo, we use totalItems
          // and the monthly_usage from the account record.
          setStats({
            totalSearches: res.totalItems,
            pendingSearches: 0, // Would require a separate API call with filter="status='Pending'"
            completedSearches: res.totalItems, // Assuming most are complete for this view
            monthlyUsage: acc.monthly_usage,
            usageLimit: acc.subscription_status === 'active' ? 'unlimited' : 5 // Example logic
          })
        }
      } catch (error) {
        console.error("Error loading dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  // Helper for status colors
  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {account?.expand?.user?.name || 'Investigator'}</p>
        </div>
        <Link 
          href="/search/new" 
          className="bg-black text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-sm flex items-center gap-2"
        >
          <span>+</span> New Investigation
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="Monthly Usage" 
          value={stats.monthlyUsage} 
          subValue={stats.usageLimit === 'unlimited' ? 'Unlimited plan' : `/ ${stats.usageLimit} searches`}
        />
        <StatCard 
          label="Total Investigations" 
          value={stats.totalSearches} 
          subValue="All time"
        />
        <StatCard 
          label="Subscription" 
          value={account?.subscription_status || 'Free'} 
          valueClassName={account?.subscription_status === 'active' ? 'text-green-600 capitalize' : 'text-gray-900 capitalize'}
          subValue={account?.subscription_status === 'active' ? 'Renews automatically' : 'Upgrade for more'}
        />
        <StatCard 
          label="Account Status" 
          value={account?.account_status || 'Unknown'} 
          valueClassName="capitalize"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-semibold text-gray-900">Recent Investigations</h3>
          <Link href="/search/history" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-gray-50/50 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentResearch.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No investigations found. Start your first search above.
                  </td>
                </tr>
              ) : (
                recentResearch.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.primary_name}</td>
                    <td className="px-6 py-4 text-gray-500">{item.entity_type}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(item.risk_level)}`}>
                        {item.risk_level || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        {item.status === 'Complete' && <span className="text-green-600 font-medium">Complete</span>}
                        {item.status === 'Pending' && <span className="text-blue-600 font-medium animate-pulse">Scanning...</span>}
                        {item.status === 'Error' && <span className="text-red-600 font-medium">Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/search/${item.id}`} className="text-gray-900 font-medium hover:text-blue-600 hover:underline">
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, subValue, valueClassName = "text-gray-900" }: { label: string, value: string | number, subValue?: string, valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-sm font-medium text-gray-500 mb-2">{label}</div>
      <div className={`text-3xl font-bold tracking-tight ${valueClassName}`}>{value}</div>
      {subValue && <div className="mt-1 text-xs text-gray-400 font-medium">{subValue}</div>}
    </div>
  )
}