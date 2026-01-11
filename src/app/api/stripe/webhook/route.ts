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
  
  const pb = new PocketBase(pbUrl)

  // ------------------------------------------------------------------
  // AUTH FIX: Authenticate as Superuser (PocketBase v0.23+)
  // ------------------------------------------------------------------
  if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
    try {
      await pb.collection('_superusers').authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL, 
          process.env.POCKETBASE_ADMIN_PASSWORD
      )
    } catch (e) {
      console.error('PocketBase Admin Auth Failed', e)
      return NextResponse.json({ error: 'Database auth failed' }, { status: 500 })
    }
  }

  try {
    switch (event.type) {
      // ------------------------------------------------------------------
      // 1. RECORD PAYMENTS (The missing piece)
      // ------------------------------------------------------------------
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const stripeCustomerId = invoice.customer as string
        
        try {
          // Find the account using the Stripe Customer ID
          const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${stripeCustomerId}"`)
          
          // Create the payment record
          await pb.collection('payments').create({
            account: account.id,
            stripe_customer_id: stripeCustomerId,
            event_type: 'payment_succeeded',
            amount: invoice.amount_paid,
            currency: invoice.currency,
            stripe_id: invoice.id,
            status: invoice.status,
            hosted_invoice_url: invoice.hosted_invoice_url || '',
            timestamp: new Date().toISOString()
          })
          console.log(`💰 Payment saved for account: ${account.id}`)
        } catch (e) {
          console.error(`Failed to record payment. No account found for Stripe Customer: ${stripeCustomerId}`)
        }
        break
      }

      // ------------------------------------------------------------------
      // 2. NEW SUBSCRIPTION
      // ------------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as any
        
        // Retrieve account_id from metadata (set in createCheckoutSession)
        const accountId = session.metadata?.account_id

        if (accountId) {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          // Fetch full subscription details from Stripe
          const subscription = await getSubscription(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Find the corresponding plan in PocketBase
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
            account_status: 'active',
            cancel_at_period_end: subscription.cancel_at_period_end.toString()
          })
          console.log(`✅ Account ${accountId} updated with subscription`)
        }
        break
      }

      // ------------------------------------------------------------------
      // 3. SUBSCRIPTION UPDATES
      // ------------------------------------------------------------------
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            const priceId = subscription.items.data[0].price.id
            
            // Find plan name again in case of upgrade/downgrade
            let planName = account.plan_name 
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
            console.log(`🔄 Subscription updated for account ${account.id}`)
        } catch (e) {
            console.error('Could not find account for customer:', subscription.customer)
        }
        break
      }

      // ------------------------------------------------------------------
      // 4. SUBSCRIPTION DELETION
      // ------------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            await pb.collection('accounts').update(account.id, {
                subscription_status: 'canceled',
                plan_name: 'Free', 
                account_status: 'inactive'
            })
            console.log(`❌ Subscription canceled for account ${account.id}`)
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