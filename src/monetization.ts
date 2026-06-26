export type MonetizationImplementationMode = 'verified-backend'

export interface CheckoutConfiguration {
  apiOrigin: string
  checkoutUrl: string | null
  paymentLinkFallbackEnabled: boolean
  isConfigured: boolean
  message: string
}

export const monetizationImplementationMode: MonetizationImplementationMode = 'verified-backend'
export const flipCalcProProductName = 'FlipCalc Pro Lifetime'
export const flipCalcProLaunchPriceDisplay = '$19.99'
export const checkoutUrlEnvKey = 'VITE_FLIPCALC_CHECKOUT_URL'
export const apiOriginEnvKey = 'VITE_FLIPCALC_API_ORIGIN'
export const paymentLinkFallbackEnabledEnvKey = 'VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK'

export const serverOnlyEnvironmentVariables = [
  'STRIPE_SECRET_KEY',
  'STRIPE_FLIPCALC_WEBHOOK_SECRET',
  'STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID',
  'FLIPCALC_APP_ORIGIN',
  'FLIPCALC_SESSION_SECRET',
  'DATABASE_URL',
  'RESEND_API_KEY'
] as const

export const clientSafeEnvironmentVariables = [
  apiOriginEnvKey,
  checkoutUrlEnvKey,
  paymentLinkFallbackEnabledEnvKey
] as const

export function getCheckoutConfiguration(env: Record<string, string | undefined>): CheckoutConfiguration {
  const apiOrigin = env[apiOriginEnvKey]?.trim().replace(/\/+$/, '') ?? ''
  const checkoutUrl = env[checkoutUrlEnvKey]?.trim()
  const paymentLinkFallbackEnabled = env[paymentLinkFallbackEnabledEnvKey] === 'true'

  if (!paymentLinkFallbackEnabled) {
    return {
      apiOrigin,
      checkoutUrl: null,
      paymentLinkFallbackEnabled,
      isConfigured: true,
      message: 'Verified backend Checkout is enabled.'
    }
  }

  if (checkoutUrl === undefined || checkoutUrl.length === 0) {
    return {
      apiOrigin,
      checkoutUrl: null,
      paymentLinkFallbackEnabled,
      isConfigured: false,
      message: `Payment Link fallback is enabled, but ${checkoutUrlEnvKey} is not configured.`
    }
  }

  try {
    const parsedUrl = new URL(checkoutUrl)

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return {
        apiOrigin,
        checkoutUrl: null,
        paymentLinkFallbackEnabled,
        isConfigured: false,
        message: `${checkoutUrlEnvKey} must be a valid http or https URL.`
      }
    }

    return {
      apiOrigin,
      checkoutUrl: parsedUrl.toString(),
      paymentLinkFallbackEnabled,
      isConfigured: true,
      message: 'Payment Link fallback is configured.'
    }
  } catch {
    return {
      apiOrigin,
      checkoutUrl: null,
      paymentLinkFallbackEnabled,
      isConfigured: false,
      message: `${checkoutUrlEnvKey} must be a valid http or https URL.`
    }
  }
}
