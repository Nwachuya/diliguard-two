'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount, getPaymentList } from '@/lib/pocketbase'
import type { AccountWithUser, Payment } from '@/types'
import { 
  CreditCard,
  Receipt,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Sparkles,
  Calendar,
  CheckCircle
} from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPayments, setTotalPayments] = useState(0)
  const [error, setError] = useState('')
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    async function loadAccount() {
      const user = pb.authStore.model
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const acc = await getAccount(user.id)
        setAccount(acc)
      } catch (e) {
        console.error('Failed to load account', e)
      } finally {
        setLoading(false)
      }
    }
    loadAccount()
  }, [router])

  useEffect(() => {
    async function fetchPayments() {
      if (!account) return

      setListLoading(true)
      try {
        const res = await getPaymentList(account.id, page, ITEMS_PER_PAGE)
        setPayments(res.items)
        setTotalPages(res.totalPages)
        setTotalPayments(res.totalItems)
      } catch (e) {
        console.error('Failed to fetch payments', e)
      } finally {
        setListLoading(false)
      }
    }

    if (!loading && account) {
      fetchPayments()
    }
  }, [page, account, loading])

  const handleManageSubscription = async () => {
    if (!account?.stripe_customer_id) {
      setError('No active subscription found. Please subscribe first.')
      return
    }

    setPortalLoading(true)
    setError('')

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken: pb.authStore.token,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      window.location.href = data.url

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to open billing portal')
      setPortalLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getSubscriptionDisplay = () => {
    const status = account?.subscription_status

    if (status === 'active') {
      return {
        label: 'Active Subscription',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        icon: CheckCircle,
      }
    }
    if (status === 'trialing') {
      const trialEnd = account?.trial_end_date 
        ? formatDate(account.trial_end_date)
        : 'soon'
      return {
        label: `Trial (ends ${trialEnd})`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: Calendar,
      }
    }
    if (status === 'past_due') {
      return {
        label: 'Payment Past Due',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        icon: AlertCircle,
      }
    }
    if (status === 'canceled') {
      return {
        label: 'Subscription Canceled',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        icon: AlertCircle,
      }
    }
    
    return {
      label: 'Free Plan',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      icon: CreditCard,
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'succeeded':
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const subscriptionDisplay = getSubscriptionDisplay()
  const SubscriptionIcon = subscriptionDisplay.icon
  const hasActiveSubscription = account?.subscription_status === 'active' || account?.subscription_status === 'trialing'
  const hasStripeCustomer = !!account?.stripe_customer_id

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and view payment history.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className={`rounded-xl border p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${subscriptionDisplay.bgColor}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${hasActiveSubscription ? 'bg-green-600' : 'bg-gray-600'}`}>
            <SubscriptionIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className={`text-sm font-medium ${subscriptionDisplay.color}`}>
              {subscriptionDisplay.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasActiveSubscription 
                ? 'Manage your subscription in the Stripe portal'
                : 'Upgrade for unlimited searches'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-700 transition"
          >
            Account Details
          </Link>
          {hasStripeCustomer ? (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-black transition flex items-center gap-2 disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Manage Subscription
                  <ExternalLink className="h-3 w-3" />
                </>
              )}
            </button>
          ) : (
            <Link
              href="/choose-plan"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade Plan
            </Link>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="bg-blue-600 rounded-lg p-3">
          <Receipt className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-900">{totalPayments}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-semibold text-gray-900">Payment History</h3>
          {listLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {hasActiveSubscription 
                ? 'Your payment history will appear here after your first billing cycle.'
                : 'Start your subscription to unlock unlimited searches and access premium features.'}
            </p>
            {!hasActiveSubscription && (
              <Link
                href="/choose-plan"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                <Sparkles className="h-4 w-4" />
                View Plans
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-500 bg-gray-50/50 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(payment.created)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">
                          {payment.event_type?.replace(/_/g, ' ') || 'Payment'}
                        </p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                          {payment.stripe_id ? `#${payment.stripe_id.slice(-8).toUpperCase()}` : '---'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(payment.status)}`}>
                        {payment.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.hosted_invoice_url ? (
                        <a
                          href={payment.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wide transition"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payments.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-start gap-4 mt-6">
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

      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-700">Need help with billing?</strong>{' '}
          Contact us at{' '}
          <a href="mailto:support@diliguard.com" className="text-blue-600 hover:underline">
            support@diliguard.com
          </a>{' '}
          or use the{' '}
          <Link href="/feedback" className="text-blue-600 hover:underline">
            feedback form
          </Link>
          .
        </p>
      </div>
    </div>
  )
}