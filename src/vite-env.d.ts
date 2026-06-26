/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLIPCALC_API_ORIGIN?: string
  readonly VITE_FLIPCALC_CHECKOUT_URL?: string
  readonly VITE_FLIPCALC_ENABLE_PAYMENT_LINK_FALLBACK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
