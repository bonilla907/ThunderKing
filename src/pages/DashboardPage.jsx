import { ArrowRight, Banknote, CalendarCheck, CalendarClock, CircleDollarSign, ClipboardList, Clock3, PackageCheck, Plus, Sunrise, TriangleAlert, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency } from '../utils/formatters'

const initialSummary = { en_proceso: 0, proximo: 0, manana: 0, hoy: 0, atrasado: 0, entregados: 0, con_saldo: 0, saldo_pendiente: 0 }

export function DashboardPage() {
  const { profile } = useAuth()
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const firstName = profile?.Nombre?.split(' ')[0] || 'Administrador'

  useEffect(() => {
    let active = true
    getDashboardSummary().then((data) => { if (active) setSummary(data) }).catch(() => { if (active) setError('No fue posible cargar los indicadores. Intenta actualizar la página.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const metrics = [
    { key: 'en_proceso', label: 'En proceso', icon: Clock3, to: '/pedidos?categoria=en_proceso' },
    { key: 'proximo', label: 'Próximos', icon: CalendarClock, to: '/pedidos?categoria=proximo' },
    { key: 'manana', label: 'Entrega mañana', icon: Sunrise, to: '/pedidos?categoria=manana' },
    { key: 'hoy', label: 'Entrega hoy', icon: CalendarCheck, to: '/pedidos?categoria=hoy' },
    { key: 'atrasado', label: 'Atrasados', icon: TriangleAlert, to: '/pedidos?categoria=atrasado', tone: 'danger' },
    { key: 'entregados', label: 'Entregados', icon: PackageCheck, to: '/entregados' },
    { key: 'con_saldo', label: 'Pedidos con saldo', icon: Banknote, to: '/entregados?filtro=con_saldo', tone: 'warning' },
  ]

  return <div className="page-stack">
    <section className="welcome-card dashboard-welcome"><div><span className="eyebrow">Resumen general</span><h1>Hola, {firstName}</h1><p>Consulta las prioridades del taller y los saldos pendientes.</p></div><Link className="primary-button primary-button--inline" to="/pedidos/nuevo"><Plus size={19} />Nuevo pedido</Link></section>
    {error && <div className="alert alert--error">{error}</div>}
    <section><div className="section-heading"><div><h2>Estado de pedidos</h2><p>Indicadores calculados con la fecha de entrega actual.</p></div></div>
      {loading ? <div className="dashboard-metrics dashboard-metrics--loading">{metrics.map(({ key }) => <div className="metric-skeleton" key={key} />)}</div> : <div className="dashboard-metrics">{metrics.map(({ key, label, icon: Icon, to, tone }) => <Link className={`metric-card ${tone ? `metric-card--${tone}` : ''}`} to={to} key={key}><span className="metric-card__icon"><Icon size={21} /></span><div><strong>{summary[key]}</strong><span>{label}</span></div><ArrowRight size={17} /></Link>)}</div>}
    </section>
    <section className="receivables-card"><div className="receivables-card__icon"><CircleDollarSign size={27} /></div><div><span>Total pendiente por cobrar</span><strong>{loading ? 'Calculando…' : formatCurrency(summary.saldo_pendiente)}</strong><small>{loading ? 'Consultando pedidos' : `${summary.con_saldo} pedido${summary.con_saldo === 1 ? '' : 's'} con saldo pendiente`}</small></div><Link className="secondary-button" to="/entregados?filtro=con_saldo">Revisar saldos<ArrowRight size={17} /></Link></section>
    <section><div className="section-heading"><div><h2>Accesos rápidos</h2><p>Registra pedidos y consulta la información principal.</p></div></div><div className="quick-grid">
      <QuickLink to="/pedidos" icon={ClipboardList} title="Pedidos" text="Consulta y da seguimiento a los pedidos." />
      <QuickLink to="/entregados" icon={PackageCheck} title="Entregados" text="Revisa los trabajos que ya fueron entregados." />
      <QuickLink to="/clientes" icon={Users} title="Clientes" text="Administra la información de tus clientes." />
    </div></section>
  </div>
}

function QuickLink({ to, icon: Icon, title, text }) {
  return <Link className="quick-card" to={to}><span className="quick-card__icon"><Icon size={23} /></span><div><h3>{title}</h3><p>{text}</p></div><ArrowRight className="quick-card__arrow" size={20} /></Link>
}
