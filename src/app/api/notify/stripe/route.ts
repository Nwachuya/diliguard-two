import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'
import { constructWebhookEvent, getSubscription } from '@/lib/stripe'

// Prevent caching to ensure every webhook is processed
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature') as string

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('SERVER ERROR: STRIPE_WEBHOOK_SECRET is not set')
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

  // AUTHENTICATION: Admin rights required to search by stripe_customer_id
  if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
    try {
      await pb.admins.authWithPassword(
          process.env.POCKETBASE_ADMIN_EMAIL, 
          process.env.POCKETBASE_ADMIN_PASSWORD
      )
    } catch (e) {
      console.error('PocketBase Admin Auth Failed. Webhook cannot update DB.', e)
      return NextResponse.json({ error: 'Database auth failed' }, { status: 500 })
    }
  }

  try {
    switch (event.type) {
      // EVENT 1: PAYMENT SUCCESS (Records the transaction)
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
        } catch (e) {
          console.error(`Failed to record payment. No account found for Stripe Customer: ${stripeCustomerId}`)
        }
        break
      }

      // EVENT 2: CHECKOUT COMPLETE (Activates the subscription)
      case 'checkout.session.completed': {
        const session = event.data.object as any
        // metadata.account_id comes from your createCheckoutSession function
        const accountId = session.metadata?.account_id

        if (accountId) {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          // We fetch the subscription to get the clean Price ID and dates
          const subscription = await getSubscription(subscriptionId)
          const priceId = subscription.items.data[0].price.id

          // Map Stripe Price ID to your PocketBase Plan Name
          let planName = 'Unknown'
          try {
            const planRecord = await pb.collection('plans').getFirstListItem(`price_id="${priceId}"`)
            planName = planRecord.name
          } catch (e) {
            console.warn(`No plan found in PB for price_id: ${priceId}`)
          }

          // Activate the account
          await pb.collection('accounts').update(accountId, {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            subscription_status: subscription.status,
            plan_name: planName,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            account_status: 'active',
            cancel_at_period_end: String(subscription.cancel_at_period_end)
          })
        } else {
          console.error('Checkout session missing metadata.account_id')
        }
        break
      }

      // EVENT 3: SUBSCRIPTION UPDATED (Renewals/Changes)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            // Check if plan changed
            const priceId = subscription.items.data[0].price.id
            let planName = account.plan_name
            try {
                const planRecord = await pb.collection('plans').getFirstListItem(`price_id="${priceId}"`)
                planName = planRecord.name
            } catch (e) {}

            await pb.collection('accounts').update(account.id, {
                subscription_status: subscription.status,
                plan_name: planName,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: String(subscription.cancel_at_period_end)
            })
        } catch (e) {
            console.error(`Subscription update failed. No account found for: ${subscription.customer}`)
        }
        break
      }

      // EVENT 4: SUBSCRIPTION DELETED (Cancellations)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        try {
            const account = await pb.collection('accounts').getFirstListItem(`stripe_customer_id="${subscription.customer}"`)
            
            await pb.collection('accounts').update(account.id, {
                subscription_status: 'canceled',
                plan_name: 'Free', // Or whatever your default fallback is
                cancel_at_period_end: 'false'
            })
        } catch (e) {
             console.error(`Subscription delete failed. No account found for: ${subscription.customer}`)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook Logic Error:', err)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}