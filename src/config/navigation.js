import { ClipboardList, LayoutDashboard, PackageCheck, PlusCircle, Settings, Users } from 'lucide-react'

export const navigationItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Nuevo Pedido', to: '/pedidos/nuevo', icon: PlusCircle },
  { label: 'Pedidos', to: '/pedidos', icon: ClipboardList },
  { label: 'Entregados', to: '/entregados', icon: PackageCheck },
  { label: 'Clientes', to: '/clientes', icon: Users },
  { label: 'Configuración', to: '/configuracion', icon: Settings },
]
