import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { constructWebhookEvent, getSubscription } from '@/lib/stripe'

// Prevent Next.js from caching the webhook response
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  let event
  try {
    event = await constructWebhookEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL
  if (!pbUrl) {
    return NextResponse.json({ error: 'PocketBase URL missing' }, { status: 500 })
  }
  
  // Initialize PocketBase (Admin rights needed to find accounts by Stripe ID)
  const pb = new PocketBase(pbUrl)
  // Note: For webhooks, you usually need admin access to update any user's account.
  // If you have an admin email/pass in env, authenticate here. 
  // Otherwise, ensure your API rules allow these updates or use a superuser client.
  // Example with admin login (recommended for webhooks):
  if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
      await pb.admins.authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL, 
          process.env.POCKETBASE_ADMIN_PASSWORD
      )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        
        // Retrieve account_id from metadata (set in createCheckoutSession)
        const accountId = session.metadata?.account_id

        if (accountId) {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          // Fetch full subscription details from Stripe to get the status and price ID
          const subscription = await getSubscription(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Find the corresponding plan in PocketBase to get the textual name
          let planName = 'Unknown'
          try {
            const planRecord = await pb.collection('plans').getFirstListItem(`price_id="${priceId}"`)
            planName = planRecord.name
          } catch (e) {
            console.error('Plan not found for price_id:', priceId)
          }

          // Update PocketBase Account
          await pb.collection('accounts').update(accountId, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            plan_name: planName,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            account_status: 'active', // Set account to active
            cancel_at_period_end: subscription.cancel_at_period_end.toString()
          })
          console.log(`Updated account ${accountId} with subscription ${subscriptionId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        
        // We need to find the account associated with this stripe_customer_id
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            const priceId = subscription.items.data[0].price.id
            
            // Find plan name again in case of upgrade/downgrade
            let planName = account.plan_name // default to existing
            try {
                const planRecord = await pb.collection('plans').getFirstListItem(`price_id="${priceId}"`)
                planName = planRecord.name
            } catch (e) { /* ignore if plan lookup fails */ }

            await pb.collection('accounts').update(account.id, {
                subscription_status: subscription.status,
                plan_name: planName,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end.toString()
            })
        } catch (e) {
            console.error('Could not find account for customer:', subscription.customer)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            await pb.collection('accounts').update(account.id, {
                subscription_status: 'canceled',
                plan_name: 'Free', // Revert to Free or specific logic
                account_status: 'inactive' // or keep active if you allow free tier access
            })
        } catch (e) {
            console.error('Could not find account for customer:', subscription.customer)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook processing failed:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}