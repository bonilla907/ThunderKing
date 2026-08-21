import { LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { Brand } from '../ui/Brand'

export function Sidebar({ open, onClose }) {
  const { profile, user, logout } = useAuth()
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header"><Brand /><button type="button" className="icon-button sidebar__close" onClick={onClose} aria-label="Cerrar menú"><X size={21} /></button></div>
      <nav className="sidebar__nav" aria-label="Navegación principal">
        <span className="sidebar__section-label">Menú principal</span>
        {navigationItems.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} end onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
            <Icon size={20} strokeWidth={1.9} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className="user-card"><span className="user-card__avatar">{(profile?.Nombre || user?.email || 'A').charAt(0).toUpperCase()}</span><span className="user-card__identity"><strong>{profile?.Nombre || 'Administrador'}</strong><small>{user?.email}</small></span></div>
        <button className="logout-button" type="button" onClick={logout}><LogOut size={19} />Cerrar sesión</button>
      </div>
    </aside>
  )
}
