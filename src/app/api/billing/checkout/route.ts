import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { createCustomer, createCheckoutSession } from '@/lib/stripe'
import type { AccountWithUser } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { authToken, priceId } = body

    if (!authToken || !priceId) {
      return NextResponse.json(
        { error: 'Missing authentication token or price ID' },
        { status: 400 }
      )
    }

    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!pbUrl || !appUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize PocketBase
    const pb = new PocketBase(pbUrl)
    pb.authStore.save(authToken, null)

    // FIX: Verify token and load user data from the database
    try {
      await pb.collection('users').authRefresh()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      )
    }

    const user = pb.authStore.model
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Fetch the account
    let account: AccountWithUser
    try {
      account = await pb.collection('accounts').getFirstListItem(
        `user="${user.id}"`
      ) as AccountWithUser
    } catch (e: any) {
      // If account doesn't exist, create it (fallback logic)
      if (e.status === 404) {
        account = await pb.collection('accounts').create({
          user: user.id,
          role: 'user',
          account_status: 'new',
          monthly_usage: 0,
          plan_name: 'Free'
        }) as AccountWithUser
      } else {
        throw e
      }
    }

    let stripeCustomerId = account.stripe_customer_id

    // 1. Create Stripe Customer if one doesn't exist
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', user.email)
      
      const newCustomer = await createCustomer(
        user.email, 
        user.name || undefined,
        { account_id: account.id } // Metadata
      )

      stripeCustomerId = newCustomer.id

      // Update PocketBase with the new customer ID
      await pb.collection('accounts').update(account.id, {
        stripe_customer_id: stripeCustomerId,
      })
    }

    // 2. Create Checkout Session
    const successUrl = `${appUrl}/billing`
    
    const session = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl,
      account.id // This maps to metadata.account_id in your helper
    )

    if (!session.url) {
      throw new Error('Failed to generate session URL')
    }

    return NextResponse.json({ success: true, url: session.url })

  } catch (error: any) {
    console.error('Checkout API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout' },
      { status: 500 }
    )
  }
}