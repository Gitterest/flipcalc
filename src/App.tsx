import { Route, Routes } from 'react-router-dom'
import type { ReactElement } from 'react'
import { canAccessCalculator } from './calculators/access'
import { calculatorCatalog } from './calculators/catalog'
import { AppFooter } from './components/AppFooter'
import { AppHeader } from './components/AppHeader'
import { ChainsawFlipPage } from './pages/ChainsawFlipPage'
import { GeneralFlipPage } from './pages/GeneralFlipPage'
import { HomePage } from './pages/HomePage'
import { LockedCalculatorPage } from './pages/LockedCalculatorPage'
import { LocalVsShippedPage } from './pages/LocalVsShippedPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PhoneFlipPage } from './pages/PhoneFlipPage'
import { ContactPage, PrivacyPage, RefundPolicyPage, TermsPage } from './pages/PolicyPage'
import { PowerToolFlipPage } from './pages/PowerToolFlipPage'
import { PricingPage } from './pages/PricingPage'
import { PurchaseCancelPage } from './pages/PurchaseCancelPage'
import { PurchaseSuccessPage } from './pages/PurchaseSuccessPage'
import { RepairVsAsIsPage } from './pages/RepairVsAsIsPage'
import type { CalculatorDefinition } from './types/calculator'

const chainsawFlip = calculatorCatalog.find((calculator) => calculator.id === 'chainsaw-flip')
const localVsShipped = calculatorCatalog.find((calculator) => calculator.id === 'local-vs-shipped')
const phoneFlip = calculatorCatalog.find((calculator) => calculator.id === 'phone-flip')
const powerToolFlip = calculatorCatalog.find((calculator) => calculator.id === 'power-tool-flip')
const repairVsAsIs = calculatorCatalog.find((calculator) => calculator.id === 'repair-vs-as-is')
const hasProEntitlement = false

function CalculatorRoute({ calculator, children }: { calculator: CalculatorDefinition | undefined; children: ReactElement }) {
  if (calculator === undefined) {
    return <NotFoundPage />
  }

  if (!canAccessCalculator(calculator, hasProEntitlement)) {
    return <LockedCalculatorPage calculator={calculator} />
  }

  return children
}

export function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/purchase/success" element={<PurchaseSuccessPage />} />
          <Route path="/purchase/cancel" element={<PurchaseCancelPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/calculators/chainsaw-flip"
            element={
              <CalculatorRoute calculator={chainsawFlip}>
                <ChainsawFlipPage />
              </CalculatorRoute>
            }
          />
          <Route path="/calculators/general-flip" element={<GeneralFlipPage />} />
          <Route
            path="/calculators/local-vs-shipped"
            element={
              <CalculatorRoute calculator={localVsShipped}>
                <LocalVsShippedPage />
              </CalculatorRoute>
            }
          />
          <Route
            path="/calculators/phone-flip"
            element={
              <CalculatorRoute calculator={phoneFlip}>
                <PhoneFlipPage />
              </CalculatorRoute>
            }
          />
          <Route
            path="/calculators/power-tool-flip"
            element={
              <CalculatorRoute calculator={powerToolFlip}>
                <PowerToolFlipPage />
              </CalculatorRoute>
            }
          />
          <Route
            path="/calculators/repair-vs-as-is"
            element={
              <CalculatorRoute calculator={repairVsAsIs}>
                <RepairVsAsIsPage />
              </CalculatorRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <AppFooter />
    </div>
  )
}
