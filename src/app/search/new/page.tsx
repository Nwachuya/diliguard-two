'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pb, { getAccount } from '@/lib/pocketbase'
import type { AccountWithUser } from '@/types'
import { 
  Search,
  User,
  Building2,
  Users,
  MapPin,
  Link as LinkIcon,
  Briefcase,
  FileText,
  UserCheck,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react'

type EntityType = 'Individual' | 'Company' | 'Organization'

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

  // Check if user can search
  const canSearch = (status: string | undefined, monthlyUsage: number): boolean => {
    if (status === 'active' || status === 'trialing') {
      return true
    }
    // Free users get 2 searches per month
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

  // Poll for research completion
  const pollResearchStatus = async (researchId: string): Promise<boolean> => {
    const maxAttempts = 60 // 5 minutes max (5 sec intervals)
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

        // Wait 5 seconds before next poll
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

  // Animate loading stages
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
      // Call our API route
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

      // Poll for completion
      await pollResearchStatus(data.research_id)

      // Redirect to results
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

  // Full-screen processing state
  if (submitting) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          {/* Animated Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-blue-400 rounded-2xl animate-ping opacity-20"></div>
          </div>

          {/* Progress Message */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {processingMessage}
          </h2>
          <p className="text-gray-400 mb-8">
            Searching for: <span className="text-white font-medium">{formData.primary_name}</span>
          </p>

          {/* Progress Steps */}
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

          {/* Stage Counter */}
          <p className="text-xs text-gray-500 uppercase tracking-widest">
            Stage {processingStage + 1} of {LOADING_STAGES.length}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Entity Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Entity Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'Individual', icon: User, label: 'Individual' },
                { value: 'Company', icon: Building2, label: 'Company' },
                { value: 'Organization', icon: Users, label: 'Organization' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateField('entity_type', value as EntityType)}
                  className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.entity_type === value
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              {formData.entity_type === 'Individual' ? 'Full Name' : 'Entity Name'} *
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <UserCheck className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="text"
                required
                maxLength={500}
                placeholder={formData.entity_type === 'Individual' ? 'John Doe' : 'Acme Corporation'}
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                value={formData.primary_name}
                onChange={(e) => updateField('primary_name', e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Location
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="text"
                maxLength={500}
                placeholder="City, Country"
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                value={formData.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Website / LinkedIn URL
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
              />
            </div>
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Industry / Sector
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <Briefcase className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="text"
                maxLength={500}
                placeholder="Finance, Technology, Healthcare..."
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                value={formData.industry}
                onChange={(e) => updateField('industry', e.target.value)}
              />
            </div>
          </div>

          {/* Tax Registration */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Tax / Registration Number
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="text"
                maxLength={500}
                placeholder="VAT, EIN, Company Registration..."
                className="w-full h-12 pl-12 pr-4 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all"
                value={formData.tax_reg}
                onChange={(e) => updateField('tax_reg', e.target.value)}
              />
            </div>
          </div>

          {/* Known Aliases */}
          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Known Aliases / Other Names
            </label>
            <textarea
              maxLength={1000}
              rows={2}
              placeholder="Previous names, nicknames, trading names..."
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all resize-none"
              value={formData.known_aliases}
              onChange={(e) => updateField('known_aliases', e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !formData.primary_name.trim()}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-5 w-5" />
            Start Investigation
          </button>
        </form>
      </div>
    </div>
  )
}