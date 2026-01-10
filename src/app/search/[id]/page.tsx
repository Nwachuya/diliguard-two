'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import pb, { getAccount } from '@/lib/pocketbase'
import type { Research, AccountWithUser } from '@/types'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  User,
  Building2,
  Users,
  MapPin,
  Globe,
  Briefcase,
  FileText,
  Calendar,
  Shield,
  AlertCircle,
  Target,
  UserCheck
} from 'lucide-react'

function ScoreBar({ score, label }: { score?: number; label: string }) {
  const value = score ?? 0
  
  function getBarColor(val: number) {
    if (val >= 70) return 'bg-green-500'
    if (val >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function FlagCard({
  type,
  description,
  sourceUrl
}: {
  type: 'red' | 'green'
  description?: string
  sourceUrl?: string
}) {
  if (!description) return null

  const isRed = type === 'red'
  const bgClass = isRed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
  const iconBgClass = isRed ? 'bg-red-200' : 'bg-green-200'
  const textClass = isRed ? 'text-red-800' : 'text-green-800'
  const linkClass = isRed ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'

  const linkElement = sourceUrl ? (
    <Link
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${linkClass}`}
    >
      View Source
      <ExternalLink className="h-3 w-3" />
    </Link>
  ) : null

  return (
    <div className={`p-4 rounded-lg border ${bgClass}`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full ${iconBgClass}`}>
          {isRed ? (
            <AlertTriangle className="h-4 w-4 text-red-700" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-700" />
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm ${textClass}`}>{description}</p>
          {linkElement}
        </div>
      </div>
    </div>
  )
}

function ExternalLinkText({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-blue-600 hover:underline break-all"
    >
      {children}
    </Link>
  )
}

export default function ResearchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const researchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [research, setResearch] = useState<Research | null>(null)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [error, setError] = useState('')

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

        const res = await pb.collection('research').getOne<Research>(researchId)
        setResearch(res)
      } catch (e: unknown) {
        console.error('Failed to load research:', e)
        setError('Research not found or access denied.')
      } finally {
        setLoading(false)
      }
    }

    if (researchId) {
      loadData()
    }
  }, [researchId, router])

  function getRiskColor(level?: string) {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  function getRiskBgColor(level?: string) {
    switch (level) {
      case 'Low':
        return 'bg-green-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'High':
        return 'bg-orange-500'
      case 'Critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  function getEntityIcon(type?: string) {
    switch (type) {
      case 'Individual':
        return User
      case 'Company':
        return Building2
      case 'Organization':
        return Users
      default:
        return User
    }
  }

  function formatDate(date?: string) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading research...
      </div>
    )
  }

  if (error || !research) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Research Not Found</h1>
        <p className="text-gray-500 mb-6">{error || 'The requested research could not be loaded.'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (research.status === 'Pending') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Research In Progress</h1>
        <p className="text-gray-500 mb-6">
          We are still gathering and analyzing data for <strong>{research.primary_name}</strong>.
          This page will update automatically when complete.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  if (research.status === 'Error') {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Research Failed</h1>
        <p className="text-gray-500 mb-4">
          We encountered an error while researching <strong>{research.primary_name}</strong>.
        </p>
        {research.error_log && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-6">{research.error_log}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/search/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Try Again
          </Link>
        </div>
      </div>
    )
  }

  const EntityIcon = getEntityIcon(research.entity_type)

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-xl p-3">
              <EntityIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{research.primary_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-sm text-gray-500">{research.entity_type}</span>
                {research.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {research.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskColor(research.risk_level)}`}>
            <Shield className="h-4 w-4" />
            <span className="font-semibold">{research.risk_level || 'Unknown'} Risk</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-shrink-0">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getRiskBgColor(research.risk_level)}`}>
              <span className="text-3xl font-bold text-white">{research.overall_score ?? 'N/A'}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Overall Assessment</h3>
            <p className="text-gray-700 leading-relaxed">{research.full_verdict || 'No verdict available.'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Subject Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {research.url && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Website/Profile</p>
                    <ExternalLinkText href={research.url}>{research.url}</ExternalLinkText>
                  </div>
                </div>
              )}
              {research.industry && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Industry</p>
                    <p className="text-sm text-gray-900">{research.industry}</p>
                  </div>
                </div>
              )}
              {research.tax_reg && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Tax/Registration</p>
                    <p className="text-sm text-gray-900">{research.tax_reg}</p>
                  </div>
                </div>
              )}
              {research.known_aliases && (
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Known Aliases</p>
                    <p className="text-sm text-gray-900">{research.known_aliases}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase">Scan Date</p>
                  <p className="text-sm text-gray-900">{formatDate(research.scan_timestamp)}</p>
                </div>
              </div>
              {research.investigation_depth && (
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Investigation Depth</p>
                    <p className="text-sm text-gray-900">{research.investigation_depth}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(research.red_flag_1_desc || research.red_flag_2_desc || research.red_flag_3_desc) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Red Flags
              </h3>
              <div className="space-y-3">
                <FlagCard type="red" description={research.red_flag_1_desc} sourceUrl={research.red_flag_1_url} />
                <FlagCard type="red" description={research.red_flag_2_desc} sourceUrl={research.red_flag_2_url} />
                <FlagCard type="red" description={research.red_flag_3_desc} sourceUrl={research.red_flag_3_url} />
              </div>
            </div>
          )}

          {(research.green_flag_1_desc || research.green_flag_2_desc || research.green_flag_3_desc) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Green Flags
              </h3>
              <div className="space-y-3">
                <FlagCard type="green" description={research.green_flag_1_desc} sourceUrl={research.green_flag_1_url} />
                <FlagCard type="green" description={research.green_flag_2_desc} sourceUrl={research.green_flag_2_url} />
                <FlagCard type="green" description={research.green_flag_3_desc} sourceUrl={research.green_flag_3_url} />
              </div>
            </div>
          )}

          {research.key_associates && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Key Associates</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{research.key_associates}</p>
            </div>
          )}

          {research.online_footprint && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Online Footprint</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{research.online_footprint}</p>
            </div>
          )}

          {research.financial_indicators && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Financial Indicators</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{research.financial_indicators}</p>
            </div>
          )}

          {research.behavioral_patterns && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Behavioral Patterns</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{research.behavioral_patterns}</p>
            </div>
          )}

          {research.claims_vs_reality && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Claims vs Reality</h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{research.claims_vs_reality}</p>
            </div>
          )}

          {research.suggested_next_steps && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-3">Suggested Next Steps</h3>
              <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-wrap">{research.suggested_next_steps}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Risk Scores</h3>
            <div className="space-y-4">
              <ScoreBar score={research.prof_consistency_score} label="Professional Consistency" />
              <ScoreBar score={research.rep_integrity_score} label="Reputation Integrity" />
              <ScoreBar score={research.legal_financial_score} label="Legal & Financial" />
              <ScoreBar score={research.operational_reliability} label="Operational Reliability" />
              <ScoreBar score={research.identity_match_rating} label="Identity Match" />
              <ScoreBar score={research.data_quality_score} label="Data Quality" />
              <ScoreBar score={research.deception_score} label="Deception Risk" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Report Info</h3>
            <div className="space-y-3 text-sm">
              {research.primary_risk_category && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Primary Risk Category</span>
                  <span className="font-medium text-gray-900">{research.primary_risk_category}</span>
                </div>
              )}
              {research.follow_up_priority && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Follow-up Priority</span>
                  <span
                    className={`font-medium ${
                      research.follow_up_priority === 'High'
                        ? 'text-red-600'
                        : research.follow_up_priority === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  >
                    {research.follow_up_priority}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Report ID</span>
                <span className="font-mono text-xs text-gray-900">{research.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">{formatDate(research.created)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Actions</h3>
            <div className="space-y-3">
              <Link
                href="/search/new"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                New Investigation
              </Link>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}