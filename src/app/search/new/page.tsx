'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pb, { getAccount } from '@/lib/pocketbase'
import type { AccountWithUser } from '@/types'
import { 
  Search,
  User,
  Building2,
  MapPin,
  Link as LinkIcon,
  Briefcase,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

type EntityType = 'Individual' | 'Company'

interface FormData {
  primary_name: string
  entity_type: EntityType
  location: string
  url: string
  industry: string
  tax_reg: string
  known_aliases: string
}

const LOADING_STAGES = [
  { message: 'Initializing search...', duration: 3000 },
  { message: 'Gathering data from sources...', duration: 5000 },
  { message: 'Analyzing information...', duration: 5000 },
  { message: 'Generating risk assessment...', duration: 5000 },
  { message: 'Finalizing report...', duration: 5000 },
]

export default function NewSearchPage() {
  const router = useRouter()
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [processingStage, setProcessingStage] = useState(0)
  const [processingMessage, setProcessingMessage] = useState('')

  const [formData, setFormData] = useState<FormData>({
    primary_name: '',
    entity_type: 'Individual',
    location: '',
    url: '',
    industry: '',
    tax_reg: '',
    known_aliases: '',
  })

  const canSearch = (status: string | undefined, monthlyUsage: number): boolean => {
    if (status === 'active' || status === 'trialing') {
      return true
    }
    return monthlyUsage < 2
  }

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

        if (acc && !canSearch(acc.subscription_status, acc.monthly_usage)) {
          router.push('/choose-plan')
          return
        }
      } catch (e) {
        console.error('Failed to load account', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const pollResearchStatus = async (researchId: string): Promise<boolean> => {
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const research = await pb.collection('research').getOne(researchId)
        
        if (research.status === 'Complete') {
          return true
        }
        
        if (research.status === 'Error') {
          throw new Error(research.error_log || 'Research failed')
        }

        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++
      } catch (e: any) {
        if (e.message !== 'Research failed') {
          console.error('Polling error:', e)
        }
        throw e
      }
    }

    throw new Error('Research timed out')
  }

  const animateLoadingStages = () => {
    let currentStage = 0
    setProcessingStage(0)
    setProcessingMessage(LOADING_STAGES[0].message)

    const advanceStage = () => {
      if (currentStage < LOADING_STAGES.length - 1) {
        currentStage++
        setProcessingStage(currentStage)
        setProcessingMessage(LOADING_STAGES[currentStage].message)
        setTimeout(advanceStage, LOADING_STAGES[currentStage].duration)
      }
    }

    setTimeout(advanceStage, LOADING_STAGES[0].duration)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    animateLoadingStages()

    if (!account) {
      setError('Account not found')
      setSubmitting(false)
      return
    }

    if (!formData.primary_name.trim()) {
      setError('Please enter a name to search')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken: pb.authStore.token,
          accountId: account.id,
          primary_name: formData.primary_name,
          entity_type: formData.entity_type,
          location: formData.location,
          url: formData.url,
          industry: formData.industry,
          tax_reg: formData.tax_reg,
          known_aliases: formData.known_aliases,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create search')
      }

      await pollResearchStatus(data.research_id)
      router.push(`/search/${data.research_id}`)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to create search. Please try again.')
      setSubmitting(false)
    }
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading...
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-400 rounded-2xl animate-ping opacity-20"></div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {processingMessage}
          </h2>
          <p className="text-gray-400 mb-8">
            Searching for: <span className="text-white font-medium">{formData.primary_name}</span>
          </p>

          <div className="flex justify-center gap-2 mb-8">
            {LOADING_STAGES.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-500 ${
                  index <= processingStage ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Stage {processingStage + 1} of {LOADING_STAGES.length}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Investigation</h1>
        <p className="text-gray-500 mt-1">
          Enter details about the subject you want to investigate.
        </p>
      </div>

      {/* Usage Info */}
      {account && account.subscription_status !== 'active' && account.subscription_status !== 'trialing' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Free Plan: {2 - account.monthly_usage} search{2 - account.monthly_usage !== 1 ? 'es' : ''} remaining this month
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Upgrade for unlimited searches.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entity Type Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 inline-flex">
          <button
            type="button"
            onClick={() => updateField('entity_type', 'Individual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              formData.entity_type === 'Individual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-4 w-4" />
            Individual
          </button>
          <button
            type="button"
            onClick={() => updateField('entity_type', 'Company')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              formData.entity_type === 'Company'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Company
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {/* Primary Name - Required */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              {formData.entity_type === 'Individual' ? 'Full Name' : 'Company Name'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={500}
                placeholder={formData.entity_type === 'Individual' ? 'e.g. John Smith' : 'e.g. Acme Corporation'}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.primary_name}
                onChange={(e) => updateField('primary_name', e.target.value)}
              />
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="p-5 grid sm:grid-cols-2 gap-5">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={500}
                  placeholder="City, Country"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Industry
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={500}
                  placeholder="e.g. Finance, Technology"
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={formData.industry}
                  onChange={(e) => updateField('industry', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* URL */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Website or LinkedIn URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
              />
            </div>
          </div>

          {/* Tax Registration */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Tax / Registration Number
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                maxLength={500}
                placeholder="VAT, EIN, Company Registration Number"
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={formData.tax_reg}
                onChange={(e) => updateField('tax_reg', e.target.value)}
              />
            </div>
          </div>

          {/* Known Aliases */}
          <div className="p-5">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Known Aliases
            </label>
            <textarea
              maxLength={1000}
              rows={2}
              placeholder="Previous names, nicknames, trading names..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              value={formData.known_aliases}
              onChange={(e) => updateField('known_aliases', e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !formData.primary_name.trim()}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-4 w-4" />
          Start Investigation
        </button>

        {/* Helper Text */}
        <p className="text-center text-xs text-gray-400">
          Investigation typically takes 30-60 seconds to complete.
        </p>
      </form>
    </div>
  )
}