import Stripe from 'stripe'

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// ============================================================================
// CHECKOUT SESSION
// ============================================================================

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  accountId: string,
  trialDays?: number
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: `${successUrl}?canceled=true`,
    metadata: {
      account_id: accountId,
    },
    subscription_data: trialDays
      ? {
          trial_period_days: trialDays,
        }
      : undefined,
  })

  return session
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function createCustomer(
  email: string,
  name?: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  })

  return customer
}

export async function getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const customer = await stripe.customers.retrieve(customerId)
  return customer
}

export async function updateCustomer(
  customerId: string,
  data: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.update(customerId, data)
  return customer
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  } else {
    return await stripe.subscriptions.cancel(subscriptionId)
  }
}

export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// ============================================================================
// WEBHOOK HELPERS
// ============================================================================

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// ============================================================================
// INVOICE & PAYMENT
// ============================================================================

export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
  const invoice = await stripe.invoices.retrieve(invoiceId)
  return invoice
}

export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  return paymentIntent
}

// ============================================================================
// EXPORT
// ============================================================================

export default stripe