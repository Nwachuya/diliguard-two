'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getResearchList } from '@/lib/pocketbase'
import { AccountWithUser, Research, DashboardStats } from '@/types'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  
  // State
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [recentResearch, setRecentResearch] = useState<Research[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    pendingSearches: 0,
    completedSearches: 0,
    monthlyUsage: 0,
    usageLimit: 100 
  })

  // 1. Initial Load: Auth, Account & Stats
  useEffect(() => {
    async function loadAccountAndStats() {
      const user = pb.authStore.model
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const acc = await getAccount(user.id)
        setAccount(acc)

        if (acc) {
          // Get total count for stats (fetch minimal data)
          const res = await getResearchList(acc.id, 1, 1) 
          
          setStats({
            totalSearches: res.totalItems,
            pendingSearches: 0, 
            completedSearches: res.totalItems,
            monthlyUsage: acc.monthly_usage,
            usageLimit: acc.subscription_status === 'active' ? 'unlimited' : 5 
          })
        }
      } catch (error) {
        console.error("Error loading account:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAccountAndStats()
  }, [router])

  // 2. Fetch Research List when Page or Account changes
  useEffect(() => {
    async function fetchList() {
      if (!account) return
      
      setListLoading(true)
      try {
        const res = await getResearchList(account.id, page, ITEMS_PER_PAGE)
        setRecentResearch(res.items)
        setTotalPages(res.totalPages)
      } catch (error) {
        console.error("Error fetching list:", error)
      } finally {
        setListLoading(false)
      }
    }

    if (!loading && account) {
      fetchList()
    }
  }, [page, account, loading])

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

  // Handle Row Click
  const handleRowClick = (id: string) => {
    router.push(`/search/${id}`)
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          {/* GREETING THE USER */}
          <p className="text-gray-500 mt-1 text-lg">
            Welcome back, <span className="font-semibold text-gray-900">{account?.expand?.user?.name || 'Analyst'}</span>
          </p>
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
          {listLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
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
                <th className="px-6 py-4 text-right">View</th>
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
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item.id)}
                    className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-700">
                      {item.primary_name}
                    </td>
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
                    <td className="px-6 py-4 text-right text-gray-400 group-hover:text-blue-600">
                      &rarr;
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION CONTROLS (Aligned Left) */}
      {recentResearch.length > 0 && (
        <div className="flex items-center justify-start gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || listLoading}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || listLoading}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
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
