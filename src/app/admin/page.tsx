'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, {
  getAccount,
  getAdminDashboardStats,
  getRevenueOverTime,
  getNewUsersOverTime,
  getRiskDistribution,
  getSubscriptionDistribution,
  getRecentUsers,
  getRecentPayments,
  getRecentResearch,
} from '@/lib/pocketbase'
import type { AccountWithUser, PaymentWithAccount, ResearchWithAccount } from '@/types'
import {
  Users,
  CreditCard,
  DollarSign,
  FileSearch,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DashboardStats {
  totalUsers: number
  activeSubscriptions: number
  totalRevenue: number
  totalInvestigations: number
  newUsersThisMonth: number
  investigationsThisMonth: number
  pendingInvestigations: number
  failedInvestigations: number
}

type TimeFrame = 3 | 6 | 12

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(6)

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])
  const [usersData, setUsersData] = useState<{ month: string; users: number }[]>([])
  const [riskData, setRiskData] = useState<{ name: string; value: number; color: string }[]>([])
  const [subscriptionData, setSubscriptionData] = useState<{ name: string; value: number; color: string }[]>([])
  const [recentUsers, setRecentUsers] = useState<AccountWithUser[]>([])
  const [recentPayments, setRecentPayments] = useState<PaymentWithAccount[]>([])
  const [recentResearch, setRecentResearch] = useState<ResearchWithAccount[]>([])

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

  // Load dashboard data
  const loadData = useCallback(async () => {
    setRefreshing(true)
    try {
      const [
        statsData,
        revenue,
        users,
        risk,
        subs,
        recUsers,
        recPayments,
        recResearch,
      ] = await Promise.all([
        getAdminDashboardStats(),
        getRevenueOverTime(timeFrame),
        getNewUsersOverTime(timeFrame),
        getRiskDistribution(),
        getSubscriptionDistribution(),
        getRecentUsers(5),
        getRecentPayments(5),
        getRecentResearch(5),
      ])

      setStats(statsData)
      setRevenueData(revenue)
      setUsersData(users)
      setRiskData(risk)
      setSubscriptionData(subs)
      setRecentUsers(recUsers)
      setRecentPayments(recPayments)
      setRecentResearch(recResearch)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setRefreshing(false)
    }
  }, [timeFrame])

  // Initial load and auto-refresh
  useEffect(() => {
    if (!loading) {
      loadData()

      // Auto-refresh every 30 seconds
      const interval = setInterval(loadData, 30000)
      return () => clearInterval(interval)
    }
  }, [loading, loadData])

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  // Format relative time
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Get risk badge color
  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'High': return 'bg-orange-100 text-orange-700'
      case 'Critical': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading Admin Dashboard...
      </div>
    )
  }

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Updated {formatTimeAgo(lastUpdated)}
          </span>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          icon={Users}
          iconBg="bg-blue-600"
          value={stats?.totalUsers || 0}
          label="Total Users"
          subValue={`+${stats?.newUsersThisMonth || 0} this month`}
          subIcon={ArrowUpRight}
          subColor="text-green-600"
        />
        <StatCard
          icon={CreditCard}
          iconBg="bg-green-600"
          value={stats?.activeSubscriptions || 0}
          label="Active Subscriptions"
        />
        <StatCard
          icon={DollarSign}
          iconBg="bg-emerald-600"
          value={formatCurrency(stats?.totalRevenue || 0)}
          label="Total Revenue"
          isFormatted
        />
        <StatCard
          icon={FileSearch}
          iconBg="bg-purple-600"
          value={stats?.totalInvestigations || 0}
          label="Total Investigations"
          subValue={`${stats?.pendingInvestigations || 0} pending`}
          subIcon={Clock}
          subColor="text-blue-600"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 shrink-0">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.newUsersThisMonth || 0}</div>
            <div className="text-xs text-gray-500">New Users This Month</div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 shrink-0">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.investigationsThisMonth || 0}</div>
            <div className="text-xs text-gray-500">Searches This Month</div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingInvestigations || 0}</div>
            <div className="text-xs text-gray-500">Pending Investigations</div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-100 shrink-0">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats?.failedInvestigations || 0}</div>
            <div className="text-xs text-gray-500">Failed Investigations</div>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Timeframe:</span>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {([3, 6, 12] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                timeFrame === tf
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tf}M
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Revenue Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* New Users Chart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">New Users Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value: number) => [value, 'Users']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {riskData.reduce((sum, d) => sum + d.value, 0) === 0 ? (
              <p className="text-gray-400 text-sm">No completed investigations yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {subscriptionData.reduce((sum, d) => sum + d.value, 0) === 0 ? (
              <p className="text-gray-400 text-sm">No accounts yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Users */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Recent Users</h3>
            <Link href="/admin/users" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentUsers.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No users yet</p>
            ) : (
              recentUsers.map((account) => (
                <div key={account.id} className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {account.expand?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.expand?.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {account.expand?.user?.email}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(account.created).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Recent Payments</h3>
            <Link href="/admin/payments" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPayments.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No payments yet</p>
            ) : (
              recentPayments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {payment.expand?.account?.expand?.user?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === 'succeeded' || payment.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Investigations */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Recent Investigations</h3>
            <Link href="/admin/searches" className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentResearch.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">No investigations yet</p>
            ) : (
              recentResearch.map((research) => (
                <div key={research.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {research.primary_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {research.entity_type} • {new Date(research.created).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRiskColor(research.risk_level)}`}>
                    {research.risk_level || 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  icon: React.ElementType
  iconBg: string
  value: number | string
  label: string
  subValue?: string
  subIcon?: React.ElementType
  subColor?: string
  isFormatted?: boolean
}

function StatCard({ icon: Icon, iconBg, value, label, subValue, subIcon: SubIcon, subColor, isFormatted }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${iconBg} shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className={`text-2xl font-bold text-gray-900 ${isFormatted ? '' : ''}`}>
          {value}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
        {subValue && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${subColor || 'text-gray-400'}`}>
            {SubIcon && <SubIcon className="h-3 w-3" />}
            {subValue}
          </div>
        )}
      </div>
    </div>
  )
}
