// app/choose-plan/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import pb from '@/lib/pocketbase'
// Assuming these types are defined in your types.ts
import type { AccountWithUser, Plan } from '@/types' 
import { 
  Check, 
  Loader2, 
  Sparkles, 
  CreditCard,
  AlertCircle 
} from 'lucide-react'

export default function ChoosePlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountWithUser | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null) // Stores the ID of the plan currently being checked out
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setError(null); // Clear any previous errors

      const user = pb.authStore.model
      if (user) {
        // If logged in, fetch account to see current plan and subscription status
        try {
          const acc = await pb.collection('accounts').getFirstListItem(
            `user="${user.id}"`, { expand: 'user' }
          ) as AccountWithUser;
          setAccount(acc);
        } catch (e) {
          console.error('Failed to load account:', e);
          // If account not found (e.g., new user), we'll assume no active subscription
          // The page should still load and display plans.
        }
      }
      
      // Fetch real plans from our API route
      try {
        const response = await fetch('/api/plans');
        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }
        const fetchedPlans: Plan[] = await response.json();
        setPlans(fetchedPlans);
      } catch (e: any) {
        console.error('Error fetching plans:', e);
        setError(e.message || 'Could not load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [])

  const handleSubscribe = async (plan: Plan) => {
    setError(null);
    setCheckoutLoading(plan.id);

    try {
      // Ensure user is logged in before proceeding with subscription
      if (!pb.authStore.isValid) {
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      // We will create this API route in the next step
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authToken: pb.authStore.token,
          priceId: plan.price_id, // Use the price_id from the fetched plan
          planName: plan.name, // Pass the plan name for better logging/tracking if needed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate checkout');
      }

      // Redirect to Stripe Checkout Session URL
      window.location.href = data.url;

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to process subscription. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const currentSubscriptionStatus = account?.subscription_status;
  const isCurrentlySubscribed = currentSubscriptionStatus === 'active' || currentSubscriptionStatus === 'trialing';
  const currentPlanName = account?.plan_name; // Assuming 'plan_name' is on the account

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
        Loading plans...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-12">
        <Sparkles className="h-10 w-10 text-blue-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Unlock the full potential of our platform with a plan that fits your needs.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {isCurrentlySubscribed && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 max-w-2xl mx-auto">
          <Check className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              You are currently on the <span className="font-bold capitalize">
                {currentSubscriptionStatus === 'trialing' ? 'Trial' : currentPlanName || 'an active plan'}
              </span>.
            </p>
            <Link href="/billing" className="text-xs text-blue-600 hover:underline mt-0.5 block">
              Manage your subscription
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.length === 0 && !loading && !error ? (
          <div className="md:col-span-3 text-center p-12 bg-gray-50 rounded-xl border border-gray-200">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-500">
              It looks like there are no subscription plans configured yet. Please check back later.
            </p>
          </div>
        ) : (
          plans.map((plan) => {
            const isCurrentPlan = isCurrentlySubscribed && currentPlanName === plan.name;
            const isFreePlanAndNotSubscribed = plan.name.toLowerCase() === 'free' && !isCurrentlySubscribed;
            const isDisabled = checkoutLoading === plan.id || isCurrentPlan || (plan.name.toLowerCase() === 'free' && isCurrentlySubscribed);
            // Assuming 'Free' plan has price 0, other plans have non-zero price
            const isDowngradeToFree = isCurrentlySubscribed && plan.name.toLowerCase() === 'free' && currentPlanName !== 'Free';

            return (
              <div 
                key={plan.id} 
                className={`
                  relative p-8 border rounded-2xl shadow-lg flex flex-col transition-all duration-300
                  ${plan.name.toLowerCase() === 'pro' ? 'border-blue-600 ring-2 ring-blue-600 shadow-blue-200/50' : 'border-gray-200 hover:shadow-xl'}
                  ${isCurrentPlan ? 'bg-blue-50 border-blue-600' : 'bg-white'}
                `}
              >
                {plan.name.toLowerCase() === 'pro' && ( // You might want to make 'isPopular' a field in PocketBase
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-blue-600 text-white text-xs font-bold uppercase px-3 py-1 rounded-full tracking-wide">
                    Popular
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-gray-500 mb-6">{plan.description}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-extrabold text-gray-900">
                    {plan.display_price === 'Free' ? 'Free' : `$${plan.price / 100}`}
                  </span>
                  {plan.display_price !== 'Free' && (
                    <span className="text-xl font-medium text-gray-600">/month</span>
                  )}
                </div>

                <ul className="space-y-3 flex-grow mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isDisabled}
                  className={`
                    mt-auto w-full px-6 py-3 rounded-xl text-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2
                    ${plan.name.toLowerCase() === 'pro' // Apply popular styling
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30'
                      : 'bg-gray-900 text-white hover:bg-black shadow-md'}
                    ${isDisabled
                      ? 'opacity-60 cursor-not-allowed bg-gray-300 text-gray-700'
                      : ''}
                  `}
                >
                  {checkoutLoading === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isCurrentPlan ? (
                        'Current Plan'
                      ) : isFreePlanAndNotSubscribed ? (
                        'Get Started'
                      ) : isDowngradeToFree ? (
                        'Downgrade to Free'
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          {isCurrentlySubscribed ? 'Change Plan' : 'Get Started'}
                        </>
                      )}
                    </>
                  )}
                </button>
                {isCurrentPlan && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                        You are currently subscribed to this plan.
                    </p>
                )}
                {isFreePlanAndNotSubscribed && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                        No credit card required.
                    </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Questions? Check our <Link href="/faq" className="text-blue-600 hover:underline">FAQ</Link> or contact <a href="mailto:support@diliguard.com" className="text-blue-600 hover:underline">support</a>.</p>
      </div>
    </div>
  )
}