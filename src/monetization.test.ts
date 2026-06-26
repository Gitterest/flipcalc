import { describe, expect, it } from 'vitest'
import {
  checkoutUrlEnvKey,
  clientSafeEnvironmentVariables,
  flipCalcProLaunchPriceDisplay,
  getCheckoutConfiguration,
  monetizationImplementationMode,
  serverOnlyEnvironmentVariables
} from './monetization'

describe('monetization configuration', () => {
  it('uses the Payment Link MVP implementation mode', () => {
    expect(monetizationImplementationMode).toBe('payment-link-mvp')
  })

  it('reports missing checkout URL configuration without unlocking checkout', () => {
    const configuration = getCheckoutConfiguration({})

    expect(configuration).toEqual({
      checkoutUrl: null,
      isConfigured: false,
      message: `Stripe checkout is not configured. Set ${checkoutUrlEnvKey} to a Stripe-hosted Payment Link.`
    })
  })

  it('accepts a configured Stripe-hosted checkout URL', () => {
    const configuration = getCheckoutConfiguration({
      VITE_FLIPCALC_CHECKOUT_URL: ' https://buy.stripe.com/test_123 '
    })

    expect(configuration.checkoutUrl).toBe('https://buy.stripe.com/test_123')
    expect(configuration.isConfigured).toBe(true)
  })

  it('rejects invalid checkout URLs gracefully', () => {
    expect(getCheckoutConfiguration({ VITE_FLIPCALC_CHECKOUT_URL: 'not-a-url' })).toMatchObject({
      checkoutUrl: null,
      isConfigured: false
    })
    expect(getCheckoutConfiguration({ VITE_FLIPCALC_CHECKOUT_URL: 'javascript:alert(1)' })).toMatchObject({
      checkoutUrl: null,
      isConfigured: false
    })
  })

  it('keeps server-only Stripe variables out of client-safe configuration', () => {
    expect(clientSafeEnvironmentVariables).toEqual(['VITE_FLIPCALC_CHECKOUT_URL'])
    expect(serverOnlyEnvironmentVariables).toEqual([
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID',
      'FLIPCALC_APP_ORIGIN'
    ])
    expect(serverOnlyEnvironmentVariables.every((variableName) => !variableName.startsWith('VITE_'))).toBe(true)
  })

  it('treats the launch price as display copy, not payment authority', () => {
    expect(flipCalcProLaunchPriceDisplay).toBe('$19.99')
  })
})
