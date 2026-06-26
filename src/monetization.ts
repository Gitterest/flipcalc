export type MonetizationImplementationMode = 'payment-link-mvp'

export interface CheckoutConfiguration {
  checkoutUrl: string | null
  isConfigured: boolean
  message: string
}

export const monetizationImplementationMode: MonetizationImplementationMode = 'payment-link-mvp'
export const flipCalcProProductName = 'FlipCalc Pro Lifetime'
export const flipCalcProLaunchPriceDisplay = '$19.99'
export const checkoutUrlEnvKey = 'VITE_FLIPCALC_CHECKOUT_URL'

export const serverOnlyEnvironmentVariables = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_FLIPCALC_PRO_LIFETIME_PRICE_ID',
  'FLIPCALC_APP_ORIGIN'
] as const

export const clientSafeEnvironmentVariables = [checkoutUrlEnvKey] as const

export function getCheckoutConfiguration(env: Record<string, string | undefined>): CheckoutConfiguration {
  const checkoutUrl = env[checkoutUrlEnvKey]?.trim()

  if (checkoutUrl === undefined || checkoutUrl.length === 0) {
    return {
      checkoutUrl: null,
      isConfigured: false,
      message: `Stripe checkout is not configured. Set ${checkoutUrlEnvKey} to a Stripe-hosted Payment Link.`
    }
  }

  try {
    const parsedUrl = new URL(checkoutUrl)

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return {
        checkoutUrl: null,
        isConfigured: false,
        message: `${checkoutUrlEnvKey} must be a valid http or https URL.`
      }
    }

    return {
      checkoutUrl: parsedUrl.toString(),
      isConfigured: true,
      message: 'Stripe-hosted checkout is configured.'
    }
  } catch {
    return {
      checkoutUrl: null,
      isConfigured: false,
      message: `${checkoutUrlEnvKey} must be a valid http or https URL.`
    }
  }
}
