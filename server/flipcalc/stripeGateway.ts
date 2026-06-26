import Stripe from 'stripe'
import type {
  CheckoutSessionCreateInput,
  CreatedCheckoutSession,
  StripeCheckoutSession,
  StripeGateway,
  StripeLineItem,
  StripeWebhookEvent
} from './types'

function normalizeMetadata(metadata: Stripe.Metadata | null): Record<string, string | undefined> {
  return metadata ?? {}
}

function normalizeCheckoutSession(session: Stripe.Checkout.Session): StripeCheckoutSession {
  const customerEmail =
    session.customer_details?.email ?? (typeof session.customer_email === 'string' ? session.customer_email : null)
  const customerId = typeof session.customer === 'string' ? session.customer : null
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  return {
    id: session.id,
    mode: session.mode,
    paymentStatus: session.payment_status,
    customerEmail,
    customerId,
    paymentIntentId,
    metadata: normalizeMetadata(session.metadata)
  }
}

export class StripeSdkGateway implements StripeGateway {
  private readonly stripe: Stripe

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey)
    this.webhookSecret = webhookSecret
  }

  private readonly webhookSecret: string

  async createCheckoutSession(input: CheckoutSessionCreateInput): Promise<CreatedCheckoutSession> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata,
      customer_creation: 'if_required'
    })

    if (session.url === null) {
      throw new Error('Stripe did not return a Checkout URL.')
    }

    return {
      id: session.id,
      url: session.url
    }
  }

  async constructWebhookEvent(rawBody: string, signature: string): Promise<StripeWebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret)

    return {
      id: event.id,
      type: event.type,
      dataObject: event.data.object
    }
  }

  async retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession | null> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)

    return normalizeCheckoutSession(session)
  }

  async listCheckoutSessionLineItems(sessionId: string): Promise<StripeLineItem[]> {
    const lineItems = await this.stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 })

    return lineItems.data.map((lineItem) => ({
      priceId: lineItem.price?.id ?? null
    }))
  }
}
