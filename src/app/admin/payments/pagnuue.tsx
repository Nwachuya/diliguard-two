'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import pb, { getAccount, getAllPayments } from '@/lib/pocketbase'
import type { PaymentWithAccount } from '@/types'
import {
  DollarSign,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  Eye,
  X,
  Calendar,
  CreditCard,
  User,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'

type StatusFilter = 'all' | 'succeeded' | 'paid' | 'pending' | 'failed'
type DateFilter = 'all' | 'this_month' | 'last_month' | 'last_3_months'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Stats
  const [revenueThisMonth, setRevenueThisMonth] = useState(0)
  const [revenueLastMonth, setRevenueLastMonth] = useState(0)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [failedTransactions, setFailedTransactions] = useState(0)

  // Data
  const [payments, setPayments] = useState<PaymentWithAccount[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  // Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithAccount | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Check admin access
  useEffect(() => {
    async function checkAccess() {
      const user = pb.authStore.model
      if (!user) {
        router.push('/login')
        return
      }

      const account = await getAccount(user.id)
      if (!account || account.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setLoading(false)
    }
    checkAccess()
  }, [router])

  // Build filter string
  const buildFilterString = useCallback(() => {
    const parts: string[] = []

    if (statusFilter !== 'all') {
      parts.push(`status="${statusFilter}"`)
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          parts.push(`created>="${startDate.toISOString()}" && created<="${endDate.toISOString()}"`)
          return parts.length > 0 ? parts.join(' && ') : undefined
        case 'last_3_months':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          break
        default:
          startDate = new Date(0)
      }

      if ((dateFilter as string) !== 'last_month') {
        parts.push(`created>="${startDate.toISOString()}"`)
      }
    }

    if (searchQuery.trim()) {
      parts.push(`(account.user.email~"${searchQuery}" || stripe_id~"${searchQuery}")`)
    }

    return parts.length > 0 ? parts.join(' && ') : undefined
  }, [statusFilter, dateFilter, searchQuery])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const now = new Date()
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

      // This month revenue
      const thisMonthPayments = await pb.collection('payments').getFullList({
        filter: `created>="${startOfThisMonth.toISOString()}" && (status="paid" || status="succeeded")`,
      })
      setRevenueThisMonth(thisMonthPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0))

      // Last month revenue
      const lastMonthPayments = await pb.collection('payments').getFullList({
        filter: `created>="${startOfLastMonth.toISOString()}" && created<="${endOfLastMonth.toISOString()}" && (status="paid" || status="succeeded")`,
      })
      setRevenueLastMonth(lastMonthPayments.reduce((sum, p: any) => sum + (p.amount || 0), 0))

      // Total transactions
      const allPayments = await pb.collection('payments').getList(1, 1)
      setTotalTransactions(allPayments.totalItems)

      // Failed transactions
      const failedPayments = await pb.collection('payments').getList(1, 1, {
        filter: 'status="failed"',
      })
      setFailedTransactions(failedPayments.totalItems)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [])

  // Load payments
  const loadPayments = useCallback(async () => {
    setListLoading(true)
    try {
      const filter = buildFilterString()
      const result = await getAllPayments(page, ITEMS_PER_PAGE, filter)
      setPayments(result.items)
      setTotalPages(result.totalPages)
      setTotalItems(result.totalItems)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setListLoading(false)
    }
  }, [page, buildFilterString])

  // Load on mount and changes
  useEffect(() => {
    if (!loading) {
      loadStats()
      loadPayments()
    }
  }, [loading, loadStats, loadPayments])

  // Auto-refresh
  useEffect(() => {
    if (!loading && !showDetailModal) {
      const interval = setInterval(() => {
        loadStats()
        loadPayments()
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [loading, loadStats, loadPayments, showDetailModal])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, dateFilter])

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // Handle view details
  const handleViewDetails = (payment: PaymentWithAccount) => {
    setSelectedPayment(payment)
    setShowDetailModal(true)
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading...
      </div>
    )
  }

  const revenueChange = revenueLastMonth > 0 
    ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
    : 0

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments</h1>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {totalItems}
            </span>
          </div>
          <p className="text-gray-500 mt-1">View all transactions and revenue</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {listLoading ? 'Updating...' : `Updated ${formatTimeAgo(lastUpdated)}`}
          </span>
          <button
            onClick={() => {
              loadStats()
              loadPayments()
            }}
            disabled={listLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-600 shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueThisMonth)}</div>
            <div className="text-xs text-gray-500">Revenue This Month</div>
            {revenueChange !== 0 && (
              <div className={`text-xs mt-1 flex items-center gap-1 ${revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(revenueChange).toFixed(1)}% vs last month
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-500 shrink-0">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenueLastMonth)}</div>
            <div className="text-xs text-gray-500">Revenue Last Month</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-600 shrink-0">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalTransactions}</div>
            <div className="text-xs text-gray-500">Total Transactions</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${failedTransactions > 0 ? 'bg-red-600' : 'bg-gray-400'}`}>
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{failedTransactions}</div>
            <div className="text-xs text-gray-500">Failed Transactions</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or Stripe ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="succeeded">Succeeded</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-gray-50/80 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Stripe ID</th>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {formatDateShort(payment.created)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(payment.expand?.account as any)?.expand?.user?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(payment.expand?.account as any)?.expand?.user?.email}
                        </p>
                     </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1 uppercase">
                        {payment.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {payment.stripe_id?.slice(-12) || '—'}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {payment.hosted_invoice_url ? (
                        <a
                          href={payment.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || listLoading}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-sm text-gray-600 font-medium px-3">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || listLoading}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Amount Header */}
              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                <p className="text-gray-500 mt-1 uppercase text-sm">{selectedPayment.currency}</p>
                <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadge(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <DetailRow
                  icon={User}
                  label="Customer"
                  value={(selectedPayment.expand?.account as any)?.expand?.user?.name || 'Unknown'}
                  subValue={(selectedPayment.expand?.account as any)?.expand?.user?.email}    
                />
                <DetailRow
                  icon={Calendar}
                  label="Date"
                  value={formatDate(selectedPayment.created)}
                />
                <DetailRow
                  icon={Receipt}
                  label="Event Type"
                  value={selectedPayment.event_type?.replace(/_/g, ' ') || 'Payment'}
                />
                <DetailRow
                  icon={CreditCard}
                  label="Stripe Customer ID"
                  value={selectedPayment.stripe_customer_id}
                  mono
                />
                <DetailRow
                  icon={Receipt}
                  label="Stripe Payment ID"
                  value={selectedPayment.stripe_id}
                  mono
                />
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                {selectedPayment.hosted_invoice_url && (
                  <a
                    href={selectedPayment.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Invoice
                  </a>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  subValue,
  mono,
}: {
  icon: React.ElementType
  label: string
  value?: string
  subValue?: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono text-xs' : ''} break-all`}>
          {value || '—'}
        </p>
        {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
      </div>
    </div>
  )
}
