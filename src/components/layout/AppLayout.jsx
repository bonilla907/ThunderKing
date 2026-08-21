import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { navigationItems } from '../../config/navigation'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const currentPage = navigationItems.find((item) => location.pathname === item.to)
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button className="sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
      <div className="app-shell__content">
        <header className="topbar">
          <button type="button" className="icon-button topbar__menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button>
          <div><span className="topbar__eyebrow">Panel administrativo</span><strong>{currentPage?.label ?? 'ThunderKing'}</strong></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
