import { Route, Routes } from 'react-router-dom'
import { AppHeader } from './components/AppHeader'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PhoneFlipPage } from './pages/PhoneFlipPage'
import { PowerToolFlipPage } from './pages/PowerToolFlipPage'

export function App() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculators/phone-flip" element={<PhoneFlipPage />} />
          <Route path="/calculators/power-tool-flip" element={<PowerToolFlipPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}
