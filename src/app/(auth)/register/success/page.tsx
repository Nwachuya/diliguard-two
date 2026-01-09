import Link from 'next/link'
import { ShieldCheck, CheckCircle } from 'lucide-react'

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
       <ShieldCheck className="h-12 w-12 text-blue-600 mb-6" />
       <h1 className="text-3xl font-bold text-gray-900 mb-4">APPLICATION RECEIVED</h1>
       <p className="text-gray-600 max-w-md mb-8">
         Your onboarding request has been processed. Please check your secure email inbox to verify your identity and activate your access key.
       </p>
       <Link href="/login" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold tracking-widest uppercase text-sm">
         Proceed to Login
       </Link>
    </div>
  )
}