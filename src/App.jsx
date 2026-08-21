import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PublicRoute } from './components/auth/PublicRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { CompanySettingsPage } from './pages/settings/CompanySettingsPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ClientsPage } from './pages/clients/ClientsPage'
import { EditOrderPage } from './pages/orders/EditOrderPage'
import { NewOrderPage } from './pages/orders/NewOrderPage'
import { OrderDetailPage } from './pages/orders/OrderDetailPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { DeliveredOrdersPage } from './pages/orders/DeliveredOrdersPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}><Route path="/login" element={<LoginPage />} /></Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pedidos/nuevo" element={<NewOrderPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/pedidos/:orderId" element={<OrderDetailPage />} />
          <Route path="/pedidos/:orderId/editar" element={<EditOrderPage />} />
          <Route path="/entregados" element={<DeliveredOrdersPage />} />
          <Route path="/clientes" element={<ClientsPage />} />
          <Route path="/configuracion" element={<CompanySettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
