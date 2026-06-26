import { Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { ChainsawFlipPage } from './pages/ChainsawFlipPage'
import { HomePage } from './pages/HomePage'
import { LocalVsShippedPage } from './pages/LocalVsShippedPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PhoneFlipPage } from './pages/PhoneFlipPage'
import { PowerToolFlipPage } from './pages/PowerToolFlipPage'
import { RepairVsAsIsPage } from './pages/RepairVsAsIsPage'

export function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculators/chainsaw-flip" element={<ChainsawFlipPage />} />
          <Route path="/calculators/local-vs-shipped" element={<LocalVsShippedPage />} />
          <Route path="/calculators/phone-flip" element={<PhoneFlipPage />} />
          <Route path="/calculators/power-tool-flip" element={<PowerToolFlipPage />} />
          <Route path="/calculators/repair-vs-as-is" element={<RepairVsAsIsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
