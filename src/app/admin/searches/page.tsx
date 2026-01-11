'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getAllResearch, deleteResearch } from '@/lib/pocketbase'
import type { ResearchWithAccount } from '@/types'
import {
  FileSearch,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  Trash2,
  X,
  User,
  Building2,
  Calendar,
  MapPin,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  Briefcase,
} from 'lucide-react'

type StatusFilter = 'all' | 'Complete' | 'Pending' | 'Error'
type RiskFilter = 'all' | 'Low' | 'Medium' | 'High' | 'Critical'
type EntityFilter = 'all' | 'Individual' | 'Company'

export default function AdminSearchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Stats
  const [totalCount, setTotalCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)

  // Data
  const [research, setResearch] = useState<ResearchWithAccount[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const ITEMS_PER_PAGE = 10

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all')

  // Modals
  const [selectedResearch, setSelectedResearch] = useState<ResearchWithAccount | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

    if (riskFilter !== 'all') {
      parts.push(`risk_level="${riskFilter}"`)
    }

    if (entityFilter !== 'all') {
      parts.push(`entity_type="${entityFilter}"`)
    }

    if (searchQuery.trim()) {
      parts.push(`(primary_name~"${searchQuery}" || account.user.email~"${searchQuery}")`)
    }

    return parts.length > 0 ? parts.join(' && ') : undefined
  }, [statusFilter, riskFilter, entityFilter, searchQuery])

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const [total, completed, pending, failed] = await Promise.all([
        pb.collection('research').getList(1, 1),
        pb.collection('research').getList(1, 1, { filter: 'status="Complete"' }),
        pb.collection('research').getList(1, 1, { filter: 'status="Pending"' }),
        pb.collection('research').getList(1, 1, { filter: 'status="Error"' }),
      ])

      setTotalCount(total.totalItems)
      setCompletedCount(completed.totalItems)
      setPendingCount(pending.totalItems)
      setFailedCount(failed.totalItems)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }, [])

  // Load research
  const loadResearch = useCallback(async () => {
    setListLoading(true)
    try {
      const filter = buildFilterString()
      const result = await getAllResearch(page, ITEMS_PER_PAGE, filter)
      setResearch(result.items)
      setTotalPages(result.totalPages)
      setTotalItems(result.totalItems)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load research:', error)
    } finally {
      setListLoading(false)
    }
  }, [page, buildFilterString])

  // Load on mount and changes
  useEffect(() => {
    if (!loading) {
      loadStats()
      loadResearch()
    }
  }, [loading, loadStats, loadResearch])

  // Auto-refresh
  useEffect(() => {
    if (!loading && !showDetailModal && !showDeleteModal) {
      const interval = setInterval(() => {
        loadStats()
        loadResearch()
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [loading, loadStats, loadResearch, showDetailModal, showDeleteModal])

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, riskFilter, entityFilter])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  // Get risk badge color
  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-700 border border-green-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      case 'High':
        return 'bg-orange-100 text-orange-700 border border-orange-200'
      case 'Critical':
        return 'bg-red-100 text-red-700 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200'
    }
  }

  // Handle view details
  const handleViewDetails = (item: ResearchWithAccount) => {
    setSelectedResearch(item)
    setShowDetailModal(true)
  }

  // Handle delete click
  const handleDeleteClick = (item: ResearchWithAccount) => {
    setSelectedResearch(item)
    setShowDeleteModal(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedResearch) return

    setDeleting(true)
    try {
      await deleteResearch(selectedResearch.id)
      loadStats()
      loadResearch()
      setShowDeleteModal(false)
      setSelectedResearch(null)
    } catch (error) {
      console.error('Failed to delete research:', error)
    } finally {
      setDeleting(false)
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Investigations</h1>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
              {totalItems}
            </span>
          </div>
          <p className="text-gray-500 mt-1">Monitor all research investigations</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {listLoading ? 'Updating...' : `Updated ${formatTimeAgo(lastUpdated)}`}
          </span>
          <button
            onClick={() => {
              loadStats()
              loadResearch()
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
          <div className="p-3 rounded-xl bg-purple-600 shrink-0">
            <FileSearch className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-xs text-gray-500">Total Investigations</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-600 shrink-0">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${pendingCount > 0 ? 'bg-blue-600 animate-pulse' : 'bg-blue-600'}`}>
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${failedCount > 0 ? 'bg-red-600' : 'bg-gray-400'}`}>
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{failedCount}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or user email..."
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
              <option value="Complete">Complete</option>
              <option value="Pending">Pending</option>
              <option value="Error">Failed</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
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

          {/* Entity Filter */}
          <div className="relative">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value as EntityFilter)}
              className="appearance-none pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
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
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {research.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No investigations found
                  </td>
                </tr>
              ) : (
                research.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.entity_type === 'Individual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.entity_type === 'Individual' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Building2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.primary_name}</p>
                          <p className="text-xs text-gray-500">{item.entity_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">
                        {item.expand?.account?.expand?.user?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.expand?.account?.expand?.user?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(item.created)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskBadge(item.risk_level)}`}>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/search/${item.id}`}
                          target="_blank"
                          className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-blue-600"
                          title="Open Full Report"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 hover:bg-red-50 rounded-lg transition text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedResearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Investigation Details</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Subject Header */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className={`p-4 rounded-xl ${selectedResearch.entity_type === 'Individual' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {selectedResearch.entity_type === 'Individual' ? (
                    <User className="h-8 w-8" />
                  ) : (
                    <Building2 className="h-8 w-8" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedResearch.primary_name}</h3>
                  <p className="text-gray-500">{selectedResearch.entity_type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRiskBadge(selectedResearch.risk_level)}`}>
                      {selectedResearch.risk_level || 'Pending'}
                    </span>
                    {selectedResearch.overall_score !== undefined && (
                      <span className="text-sm text-gray-500">
                        Score: {selectedResearch.overall_score}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <DetailItem icon={User} label="Requested By" value={selectedResearch.expand?.account?.expand?.user?.name || 'Unknown'} />
                <DetailItem icon={Calendar} label="Date" value={formatDateTime(selectedResearch.created)} />
                {selectedResearch.location && (
                  <DetailItem icon={MapPin} label="Location" value={selectedResearch.location} />
                )}
                {selectedResearch.industry && (
                  <DetailItem icon={Briefcase} label="Industry" value={selectedResearch.industry} />
                )}
                {selectedResearch.url && (
                  <DetailItem icon={Globe} label="URL" value={selectedResearch.url} link />
                )}
                <DetailItem icon={Shield} label="Status" value={selectedResearch.status} />
              </div>

              {/* Verdict */}
              {selectedResearch.full_verdict && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Verdict</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                    {selectedResearch.full_verdict}
                  </p>
                </div>
              )}

              {/* Error Log */}
              {selectedResearch.error_log && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Error Log</h4>
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-4 font-mono">
                    {selectedResearch.error_log}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Link
                  href={`/search/${selectedResearch.id}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Full Report
                </Link>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    handleDeleteClick(selectedResearch)
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedResearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Investigation?</h3>
              <p className="text-gray-500 mb-2">
                Are you sure you want to delete the investigation for:
              </p>
              <p className="font-semibold text-gray-900 mb-4">
                {selectedResearch.primary_name}
              </p>
              <p className="text-sm text-red-600 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ElementType
  label: string
  value: string
  link?: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
        )}
      </div>
    </div>
  )
}
