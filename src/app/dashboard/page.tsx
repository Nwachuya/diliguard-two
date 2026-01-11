'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getResearchList } from '@/lib/pocketbase'
import { AccountWithUser, Research, DashboardStats } from '@/types'
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  FileSearch,
  User,
  Building2,
  Plus,
  ArrowRight,
  Activity,
  FolderSearch,
  CreditCard,
  Sparkles,
  Search,
  X,
  ChevronDown
} from 'lucide-react'

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

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter, setRiskFilter] = useState<string>('all')

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

  // 2. Fetch Research List when Page, Account, or Filters change
  useEffect(() => {
    async function fetchList() {
      if (!account) return
      
      setListLoading(true)
      try {
        // Build filter string
        let filterParts: string[] = []
        
        if (searchQuery.trim()) {
          filterParts.push(`primary_name~"${searchQuery.trim()}"`)
        }
        
        if (statusFilter !== 'all') {
          filterParts.push(`status="${statusFilter}"`)
        }
        
        if (riskFilter !== 'all') {
          filterParts.push(`risk_level="${riskFilter}"`)
        }
        
        const filterString = filterParts.length > 0 ? filterParts.join(' && ') : undefined
        
        const res = await getResearchList(account.id, page, ITEMS_PER_PAGE, filterString)
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
  }, [page, account, loading, searchQuery, statusFilter, riskFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, riskFilter])

  // Helper for risk level colors
  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-700 border border-green-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      case 'High': return 'bg-orange-100 text-orange-700 border border-orange-200'
      case 'Critical': return 'bg-red-100 text-red-700 border border-red-200'
      default: return 'bg-amber-50 text-amber-600 border border-amber-200'
    }
  }

  // Helper for relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Handle Row Click
  const handleRowClick = (id: string) => {
    router.push(`/search/${id}`)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setRiskFilter('all')
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || riskFilter !== 'all'

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-gray-900">{account?.expand?.user?.name || 'Analyst'}</span>
          </p>
        </div>
        <Link 
          href="/search/new" 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Investigation
        </Link>
      </div>

      {/* Stats Grid - Compact Horizontal Layout */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600 shrink-0">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Monthly Usage</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900">{stats.monthlyUsage}</div>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-600 shrink-0">
            <FolderSearch className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Investigations</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900">{stats.totalSearches}</div>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-600 shrink-0">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Subscription</div>
            <div className={`text-2xl font-bold tracking-tight capitalize ${account?.subscription_status === 'active' ? 'text-green-600' : 'text-gray-900'}`}>
              {account?.subscription_status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-600 shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Current Plan</div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 capitalize">
              {account?.plan_name || 'Free'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">Recent Investigations</h3>
            {listLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Complete">Complete</option>
                <option value="Pending">Pending</option>
                <option value="Error">Failed</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Risk Level Filter */}
            <div className="relative">
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Risk Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
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
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                        <FileSearch className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {hasActiveFilters ? 'No results found' : 'No investigations yet'}
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-sm">
                        {hasActiveFilters 
                          ? 'Try adjusting your search or filters.'
                          : 'Start your first investigation to uncover risks and insights.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          onClick={clearFilters}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                          <X className="h-4 w-4" />
                          Clear Filters
                        </button>
                      ) : (
                        <Link
                          href="/search/new"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                        >
                          <Plus className="h-4 w-4" />
                          New Investigation
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                recentResearch.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item.id)}
                    className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.entity_type === 'Individual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.entity_type === 'Individual' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {item.primary_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.entity_type}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900">{new Date(item.created).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{getRelativeTime(item.created)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRiskColor(item.risk_level)}`}>
                        {item.risk_level || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'Complete' && (
                        <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Complete
                        </span>
                      )}
                      {item.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 text-blue-600 font-medium">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Scanning...
                        </span>
                      )}
                      {item.status === 'Error' && (
                        <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-gray-400 group-hover:text-blue-600 transition-colors text-xs font-medium">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {recentResearch.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-start gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || listLoading}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || listLoading}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}