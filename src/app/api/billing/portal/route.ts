import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { createCustomerPortalSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { authToken } = body

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL

    if (!pbUrl) {
      return NextResponse.json(
        { error: 'PocketBase URL not configured' },
        { status: 500 }
      )
    }

    // Initialize PocketBase with user's auth token
    const pb = new PocketBase(pbUrl)
    pb.authStore.save(authToken, null)

    if (!pb.authStore.isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get the authenticated user
    const user = pb.authStore.model
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Fetch the user's account to get stripe_customer_id
    const account = await pb.collection('accounts').getFirstListItem(
      `user="${user.id}"`
    )

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    if (!account.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Determine return URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json(
        { error: 'App URL not configured' },
        { status: 500 }
      )
    }

    const returnUrl = `${appUrl}/billing`

    // Create Stripe Customer Portal session
    const session = await createCustomerPortalSession(
      account.stripe_customer_id,
      returnUrl
    )

    return NextResponse.json({
      success: true,
      url: session.url,
    })

  } catch (error: any) {
    console.error('Billing portal API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    )
  }
}