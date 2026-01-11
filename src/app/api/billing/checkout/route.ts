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

    // ----------------------------------------------------------------
    // Step 1: Verify the user's token to get their user ID
    // ----------------------------------------------------------------
    const pbUser = new PocketBase(pbUrl)
    pbUser.authStore.save(authToken, null)

    try {
      await pbUser.collection('users').authRefresh()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      )
    }

    const user = pbUser.authStore.model
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // ----------------------------------------------------------------
    // Step 2: Use superuser auth to fetch account (sees hidden fields)
    // ----------------------------------------------------------------
    const pbAdmin = new PocketBase(pbUrl)
    
    if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Server configuration error: missing admin credentials' },
        { status: 500 }
      )
    }

    try {
      await pbAdmin.collection('_superusers').authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
      )
    } catch (e) {
      console.error('PocketBase Admin Auth Failed:', e)
      return NextResponse.json(
        { error: 'Database auth failed' },
        { status: 500 }
      )
    }

    // ----------------------------------------------------------------
    // Step 3: Fetch or create account using admin client
    // ----------------------------------------------------------------
    let account: AccountWithUser
    try {
      account = await pbAdmin.collection('accounts').getFirstListItem(
        `user="${user.id}"`
      ) as AccountWithUser
    } catch (e: any) {
      if (e.status === 404) {
        account = await pbAdmin.collection('accounts').create({
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

    // ----------------------------------------------------------------
    // Step 4: Now stripe_customer_id will be visible
    // ----------------------------------------------------------------
    let stripeCustomerId = account.stripe_customer_id

    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', user.email)
      
      const newCustomer = await createCustomer(
        user.email, 
        user.name || undefined,
        { account_id: account.id }
      )

      stripeCustomerId = newCustomer.id

      // Update using admin client
      await pbAdmin.collection('accounts').update(account.id, {
        stripe_customer_id: stripeCustomerId,
      })
    } else {
      console.log('Using existing Stripe customer:', stripeCustomerId)
    }

    // ----------------------------------------------------------------
    // Step 5: Create Checkout Session
    // ----------------------------------------------------------------
    const successUrl = `${appUrl}/billing`
    
    const session = await createCheckoutSession(
      stripeCustomerId,
      priceId,
      successUrl,
      account.id
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