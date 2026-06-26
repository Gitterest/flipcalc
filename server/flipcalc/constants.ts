export const flipCalcProductKey = 'flipcalc_pro_lifetime'
export const flipCalcEntitlementKey = 'flipcalc_pro'
export const flipCalcSource = 'flipcalc'
export const flipCalcSessionCookieName = 'flipcalc_pro_session'
export const checkoutPath = '/api/flipcalc/checkout'
export const stripeWebhookPath = '/api/flipcalc/stripe-webhook'
export const accessRequestPath = '/api/flipcalc/access/request'
export const accessVerifyPath = '/api/flipcalc/access/verify'
export const entitlementPath = '/api/flipcalc/entitlement'
export const logoutPath = '/api/flipcalc/logout'
export const purchaseStatusPath = '/api/flipcalc/purchase-status'
export const neutralAccessResponse = 'If that email has FlipCalc Pro access, a sign-in link will be sent.'

export const checkoutMetadata = {
  product: flipCalcProductKey,
  entitlement: flipCalcEntitlementKey,
  source: flipCalcSource
} as const

export const forbiddenCheckoutRequestFields = [
  'amount',
  'currency',
  'priceId',
  'price_id',
  'productId',
  'product_id',
  'successUrl',
  'success_url',
  'cancelUrl',
  'cancel_url',
  'entitlement',
  'entitlementType'
] as const
