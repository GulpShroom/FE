import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainPage from './pages/main/MainPage'
import JourneyPassportsPage from './pages/journey/JourneyPassportsPage'
import JourneyListPage from './pages/journey/JourneyListPage'
import JourneyDetailPage from './pages/journey/JourneyDetailPage'
import JourneyFormPage from './pages/journey/JourneyFormPage'
import MyPage from './pages/my/MyPage'
import ProductListPage from './pages/my/ProductListPage'
import ProductDetailPage from './pages/my/ProductDetailPage'
import AiDiagnosisPage from './pages/my/AiDiagnosisPage'
import RegisterFlowPage from './pages/register/RegisterFlowPage'
import ResellListPage from './pages/resell/ResellListPage'
import ResellCreatePage from './pages/resell/ResellCreatePage'
import ResellDetailPage from './pages/resell/ResellDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/journey" element={<JourneyPassportsPage />} />
          <Route path="/journey/records/:productId" element={<JourneyListPage />} />
          <Route path="/journey/new" element={<JourneyFormPage />} />
          <Route path="/journey/entry/:id" element={<JourneyDetailPage />} />
          <Route path="/journey/entry/:id/edit" element={<JourneyFormPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/my/products" element={<ProductListPage />} />
          <Route path="/my/products/:id" element={<ProductDetailPage />} />
          <Route path="/my/products/:id/ai" element={<AiDiagnosisPage />} />
          <Route path="/register" element={<RegisterFlowPage />} />
          <Route path="/resell" element={<ResellListPage />} />
          <Route path="/resell/new" element={<ResellCreatePage />} />
          <Route path="/resell/:id" element={<ResellDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
