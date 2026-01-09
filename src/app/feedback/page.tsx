'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pb from '@/lib/pocketbase'
import { 
  MessageSquare, 
  Send, 
  CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function FeedbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    async function loadData() {
      const user = pb.authStore.model
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const result = await pb.collection('feedback').getList(1, 1, {
          filter: `user="${user.id}"`,
        })
        setFeedbackCount(result.totalItems)
      } catch (e) {
        console.error("Failed to load feedback count", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const user = pb.authStore.model
    if (!user) {
      setError('You must be logged in to submit feedback.')
      setSubmitting(false)
      return
    }

    if (!feedback.trim()) {
      setError('Please enter your feedback.')
      setSubmitting(false)
      return
    }

    try {
      await pb.collection('feedback').create({
        user: user.id,
        feedback: feedback.trim(),
        stage: 'new',
      })
      setSubmitted(true)
      setFeedbackCount(prev => prev + 1)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
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

  // Success State
  if (submitted) {
    return (
      <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 sm:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-50 w-20 h-20 rounded-2xl flex items-center justify-center mb-8">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Thank You!
            </h1>
            
            <p className="text-gray-500 mb-8 max-w-md">
              Your feedback has been received. We appreciate you taking the time to help us improve Diliguard.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSubmitted(false)
                  setFeedback('')
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Submit Another
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form State
  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
        <p className="text-gray-500 mt-1">Help us improve Diliguard with your suggestions.</p>
      </div>

      {/* Feedback Count Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-center gap-4">
        <div className="bg-blue-600 rounded-lg p-3">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-blue-600 font-medium">Your Submissions</p>
          <p className="text-2xl font-bold text-blue-900">{feedbackCount}</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Your Feedback
            </label>
            <textarea
              required
              rows={6}
              placeholder="Tell us what you think, report a bug, or suggest a feature..."
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-lg text-sm font-medium placeholder:text-gray-300 focus:ring-2 focus:ring-blue-600 transition-all resize-none"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Be as detailed as possible. All feedback is reviewed by our team.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Submit Feedback <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}