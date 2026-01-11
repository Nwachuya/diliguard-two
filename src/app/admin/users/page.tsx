'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import pb, { getAccount, getAllAccounts, updateAccount, suspendAccount, unsuspendAccount } from '@/lib/pocketbase'
import type { AccountWithUser } from '@/types'
import {
  Users,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  X,
  User,
  Mail,
  Calendar,
  CreditCard,
  Activity,
  Shield,
} from 'lucide-react'

type SubscriptionFilter = 'all' | 'active' | 'inactive' | 'trialing' | 'canceled'
type PlanFilter = 'all' | 'Free' | 'Basic' | 'Pro'
type AccountStatusFilter = 'all' | 'active' | 'inactive' | 'suspended' | 'new'

export default function AdminUsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Data
  const [accounts, setAccounts] = useState<AccountWithUser[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('all')
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
  const [accountStatusFilter, setAccountStatusFilter] = useState<AccountStatusFilter>('all')

  // Modals
  const [selectedAccount, setSelectedAccount] = useState<AccountWithUser | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'unsuspend' | null>(null)

  // Dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

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

    if (subscriptionFilter !== 'all') {
      parts.push(`subscription_status="${subscriptionFilter}"`)
    }

    if (planFilter !== 'all') {
      if (planFilter === 'Free') {
        parts.push(`(plan_name="Free" || plan_name="" || plan_name=null)`)
      } else {
        parts.push(`plan_name="${planFilter}"`)
      }
    }

    if (accountStatusFilter !== 'all') {
      parts.push(`account_status="${accountStatusFilter}"`)
    }

    return parts.length > 0 ? parts.join(' && ') : undefined
  }, [subscriptionFilter, planFilter, accountStatusFilter])

  // Load accounts
  const loadAccounts = useCallback(async () => {
    setListLoading(true)
    try {
      const filter = buildFilterString()
      const result = await getAllAccounts(page, ITEMS_PER_PAGE, filter, searchQuery || undefined)
      setAccounts(result.items)
      setTotalPages(result.totalPages)
      setTotalItems(result.totalItems)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setListLoading(false)
    }
  }, [page, searchQuery, buildFilterString])

  // Load on mount and filter changes
  useEffect(() => {
    if (!loading) {
      loadAccounts()
    }
  }, [loading, loadAccounts])

  // Auto-refresh every 15 seconds (pause when modal is open)
  useEffect(() => {
    if (!loading && !showDetailModal && !showEditModal && !showConfirmModal) {
      const interval = setInterval(loadAccounts, 15000)
      return () => clearInterval(interval)
    }
  }, [loading, loadAccounts, showDetailModal, showEditModal, showConfirmModal])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, subscriptionFilter, planFilter, accountStatusFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Handle actions
  const handleViewDetails = (account: AccountWithUser) => {
    setSelectedAccount(account)
    setShowDetailModal(true)
    setOpenDropdown(null)
  }

  const handleEdit = (account: AccountWithUser) => {
    setSelectedAccount(account)
    setShowEditModal(true)
    setOpenDropdown(null)
  }

  const handleSuspendClick = (account: AccountWithUser) => {
    setSelectedAccount(account)
    setConfirmAction(account.account_status === 'suspended' ? 'unsuspend' : 'suspend')
    setShowConfirmModal(true)
    setOpenDropdown(null)
  }

  const handleConfirmSuspend = async () => {
    if (!selectedAccount) return

    try {
      if (confirmAction === 'suspend') {
        await suspendAccount(selectedAccount.id)
      } else {
        await unsuspendAccount(selectedAccount.id)
      }
      loadAccounts()
    } catch (error) {
      console.error('Failed to update account status:', error)
    } finally {
      setShowConfirmModal(false)
      setSelectedAccount(null)
      setConfirmAction(null)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'trialing':
        return 'bg-blue-100 text-blue-700'
      case 'canceled':
        return 'bg-gray-100 text-gray-700'
      case 'suspended':
        return 'bg-red-100 text-red-700'
      case 'inactive':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPlanBadge = (plan?: string) => {
    switch (plan) {
      case 'Pro':
        return 'bg-purple-100 text-purple-700'
      case 'Basic':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Users</h1>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {totalItems}
            </span>
          </div>
          <p className="text-gray-500 mt-1">Manage user accounts and subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {listLoading ? 'Updating...' : `Updated ${formatTimeAgo(lastUpdated)}`}
          </span>
          <button
            onClick={loadAccounts}
            disabled={listLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${listLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Subscription Filter */}
          <div className="relative">
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value as SubscriptionFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="inactive">Inactive</option>
              <option value="canceled">Canceled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Plan Filter */}
          <div className="relative">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="Free">Free</option>
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Account Status Filter */}
          <div className="relative">
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value as AccountStatusFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="new">New</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
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
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      account.account_status === 'suspended' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                          {account.expand?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {account.expand?.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">{account.expand?.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPlanBadge(account.plan_name)}`}>
                        {account.plan_name || 'Free'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(account.subscription_status)}`}>
                        {account.subscription_status || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(account.account_status)}`}>
                        {account.account_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{account.monthly_usage}</span>
                      <span className="text-gray-400"> / mo</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(account.created)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenDropdown(openDropdown === account.id ? null : account.id)
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>

                        {openDropdown === account.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <button
                              onClick={() => handleViewDetails(account)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" /> View Details
                            </button>
                            <button
                              onClick={() => handleEdit(account)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleSuspendClick(account)}
                              className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                                account.account_status === 'suspended'
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {account.account_status === 'suspended' ? (
                                <>
                                  <UserCheck className="h-4 w-4" /> Unsuspend
                                </>
                              ) : (
                                <>
                                  <UserX className="h-4 w-4" /> Suspend
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
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

      {/* User Detail Modal */}
      {showDetailModal && selectedAccount && (
        <Modal onClose={() => setShowDetailModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {selectedAccount.expand?.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAccount.expand?.user?.name || 'Unknown'}
                </h3>
                <p className="text-gray-500">{selectedAccount.expand?.user?.email}</p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedAccount.expand?.user?.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedAccount.expand?.user?.verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>

            {/* Account Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <DetailItem icon={Shield} label="Role" value={selectedAccount.role} />
              <DetailItem icon={CreditCard} label="Plan" value={selectedAccount.plan_name || 'Free'} />
              <DetailItem icon={Activity} label="Subscription" value={selectedAccount.subscription_status || 'None'} />
              <DetailItem icon={User} label="Account Status" value={selectedAccount.account_status || 'Unknown'} />
              <DetailItem icon={Activity} label="Monthly Usage" value={String(selectedAccount.monthly_usage)} />
              <DetailItem icon={Calendar} label="Joined" value={formatDate(selectedAccount.created)} />
            </div>

            {/* Stripe Info */}
            {selectedAccount.stripe_customer_id && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Stripe Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer ID</span>
                    <code className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {selectedAccount.stripe_customer_id}
                    </code>
                  </div>
                  {selectedAccount.stripe_subscription_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subscription ID</span>
                      <code className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {selectedAccount.stripe_subscription_id}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAccount && (
        <EditUserModal
          account={selectedAccount}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            try {
              await updateAccount(selectedAccount.id, data)
              loadAccounts()
              setShowEditModal(false)
            } catch (error) {
              console.error('Failed to update account:', error)
            }
          }}
        />
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedAccount && (
        <Modal onClose={() => setShowConfirmModal(false)}>
          <div className="p-6 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              confirmAction === 'suspend' ? 'bg-red-100' : 'bg-green-100'
            }`}>
              {confirmAction === 'suspend' ? (
                <UserX className="h-6 w-6 text-red-600" />
              ) : (
                <UserCheck className="h-6 w-6 text-green-600" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmAction === 'suspend' ? 'Suspend User?' : 'Unsuspend User?'}
            </h3>
            <p className="text-gray-500 mb-6">
              {confirmAction === 'suspend'
                ? `This will prevent ${selectedAccount.expand?.user?.name || 'this user'} from accessing their account.`
                : `This will restore ${selectedAccount.expand?.user?.name || 'this user'}'s access to their account.`}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                  confirmAction === 'suspend'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {confirmAction === 'suspend' ? 'Suspend' : 'Unsuspend'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Helper Components
function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-4 w-4 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
      </div>
    </div>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function EditUserModal({
  account,
  onClose,
  onSave,
}: {
  account: AccountWithUser
  onClose: () => void
  onSave: (data: Partial<AccountWithUser>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    plan_name: account.plan_name || 'Free',
    account_status: account.account_status || 'active',
    monthly_usage: account.monthly_usage || 0,
    role: account.role || 'user',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave(formData)
    setSaving(false)
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              value={formData.plan_name}
              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Free">Free</option>
              <option value="Basic">Basic</option>
              <option value="Pro">Pro</option>
            </select>
          </div>

          {/* Account Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
            <select
              value={formData.account_status}
              onChange={(e) => setFormData({ ...formData, account_status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Monthly Usage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Usage</label>
            <input
              type="number"
              min="0"
              value={formData.monthly_usage}
              onChange={(e) => setFormData({ ...formData, monthly_usage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}
