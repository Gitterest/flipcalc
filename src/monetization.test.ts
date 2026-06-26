import { describe, expect, it } from 'vitest'
import {
  apiOriginEnvKey,
  checkoutUrlEnvKey,
  clientSafeEnvironmentVariables,
  flipCalcProLaunchPriceDisplay,
  getCheckoutConfiguration,
  monetizationImplementationMode,
  paymentLinkFallbackEnabledEnvKey,
  serverOnlyEnvironmentVariables
} from './monetization'

describe('monetization configuration', () => {
  it('uses the verified backend implementation mode', () => {
    expect(monetizationImplementationMode).toBe('verified-backend')
  })

  it('uses same-origin verified checkout by default', () => {
    const configuration = getCheckoutConfiguration({})

    expect(configuration.apiOrigin).toBe('')
    expect(configuration.checkoutUrl).toBeNull()
    expect(configuration.paymentLinkFallbackEnabled).toBe(false)
    expect(configuration.isConfigured).toBe(true)
    expect(configuration.message).toBe('Verified backend Checkout is enabled.')
  })

  it('accepts a configured Stripe-hosted checkout URL only for explicit fallback', () => {
    const configuration = getCheckoutConfiguration({
      VITE_FLIPCALC_CHECKOUT_URL: ' https://buy.stripe.com/test_123 ',
      VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: 'true'
    })

    expect(configuration.checkoutUrl).toBe('https://buy.stripe.com/test_123')
    expect(configuration.paymentLinkFallbackEnabled).toBe(true)
    expect(configuration.isConfigured).toBe(true)
  })

  it('requires a URL when fallback is explicitly enabled', () => {
    expect(getCheckoutConfiguration({ VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: 'true' })).toMatchObject({
      checkoutUrl: null,
      isConfigured: false
    })
  })

  it('rejects invalid fallback checkout URLs gracefully', () => {
    expect(
      getCheckoutConfiguration({
        VITE_FLIPCALC_CHECKOUT_URL: 'not-a-url',
        VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: 'true'
      })
    ).toMatchObject({
      checkoutUrl: null,
      isConfigured: false
    })
    expect(
      getCheckoutConfiguration({
        VITE_FLIPCALC_CHECKOUT_URL: 'javascript:alert(1)',
        VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK: 'true'
      })
    ).toMatchObject({
      checkoutUrl: null,
      isConfigured: false
    })
  })

  it('keeps server-only Stripe variables out of client-safe configuration', () => {
    expect(clientSafeEnvironmentVariables).toEqual([
      apiOriginEnvKey,
      checkoutUrlEnvKey,
      paymentLinkFallbackEnabledEnvKey
    ])
    expect(serverOnlyEnvironmentVariables).toEqual([
      'STRIPE_SECRET_KEY',
      'STRIPE_FLIPCALC_WEBHOOK_SECRET',
      'STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID',
      'FLIPCALC_APP_ORIGIN',
      'FLIPCALC_SESSION_SECRET',
      'DATABASE_URL',
      'RESEND_API_KEY'
    ])
    expect(serverOnlyEnvironmentVariables.every((variableName) => !variableName.startsWith('VITE_'))).toBe(true)
  })

  it('treats the launch price as display copy, not payment authority', () => {
    expect(flipCalcProLaunchPriceDisplay).toBe('$19.99')
  })
})
