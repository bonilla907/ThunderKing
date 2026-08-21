import { BadgeCheck, Banknote, ChevronRight, PackageCheck, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listOrders } from '../../services/ordersService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { formatPhone } from '../../utils/phone'

const filters = [
  { id: 'pagados', label: 'Entregados y pagados', icon: BadgeCheck },
  { id: 'con_saldo', label: 'Con saldo pendiente', icon: Banknote },
]

export function DeliveredOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState(searchParams.get('filtro') === 'con_saldo' ? 'con_saldo' : 'pagados')
  const selectFilter = (value) => { setFilter(value); setSearchParams(value === 'pagados' ? {} : { filtro: value }, { replace: true }) }
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { listOrders(300).then(setOrders).catch(() => setError('No fue posible cargar los pedidos entregados.')).finally(() => setLoading(false)) }, [])
  const delivered = useMemo(() => orders.filter((order) => order.Estado === 'entregado').sort((a, b) => (b.FechaEntregaReal?.toMillis?.() || 0) - (a.FechaEntregaReal?.toMillis?.() || 0)), [orders])
  const counts = { pagados: delivered.filter((order) => Number(order.Saldo) === 0).length, con_saldo: delivered.filter((order) => Number(order.Saldo) > 0).length }
  const term = search.trim().toLocaleLowerCase('es-MX')
  const digits = search.replace(/\D/g, '')
  const visible = delivered.filter((order) => (filter === 'pagados' ? Number(order.Saldo) === 0 : Number(order.Saldo) > 0) && (!term || String(order.NumeroPedido).includes(term) || order.Cliente?.Nombre?.toLocaleLowerCase('es-MX').includes(term) || (digits && order.Cliente?.Telefono?.includes(digits))))
  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Historial de entregas</span><h1>Pedidos entregados</h1><p>Consulta trabajos liquidados o continúa registrando abonos cuando exista saldo.</p></header>
    <section className="delivered-tabs">{filters.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={filter === id ? 'active' : ''} onClick={() => selectFilter(id)}><span><Icon size={20} /></span><div><strong>{label}</strong><small>{counts[id]} pedido{counts[id] === 1 ? '' : 's'}</small></div></button>)}</section>
    <section className="content-card"><div className="list-toolbar"><div className="input-with-icon search-input"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, cliente o teléfono" /></div><span>{visible.length} resultado{visible.length === 1 ? '' : 's'}</span></div>
      {error && <div className="alert alert--error">{error}</div>}{loading ? <div className="inline-loader"><span className="spinner" />Cargando entregas...</div> : visible.length === 0 ? <div className="empty-list"><PackageCheck size={31} /><h2>No hay pedidos en esta categoría</h2><p>Los pedidos aparecerán aquí después de terminarse.</p></div> : <div className="delivered-list">{visible.map((order) => <Link className={`delivered-card ${order.Saldo > 0 ? 'delivered-card--balance' : ''}`} to={`/pedidos/${order.id}`} key={order.id}><span className="delivered-card__icon"><PackageCheck size={22} /></span><div className="delivered-card__order"><small>Pedido</small><strong>#{order.NumeroPedido}</strong></div><div className="delivered-card__client"><strong>{order.Cliente?.Nombre}</strong><span>{formatPhone(order.Cliente?.Telefono)}</span></div><div><small>Entregado</small><strong>{formatDate(order.FechaEntregaReal)}</strong></div><div className="delivered-card__money"><small>{order.Saldo > 0 ? 'Saldo pendiente' : 'Total pagado'}</small><strong>{formatCurrency(order.Saldo > 0 ? order.Saldo : order.TotalPagado)}</strong></div><span className={`delivery-badge ${order.Saldo > 0 ? 'delivery-badge--balance' : ''}`}>{order.Saldo > 0 ? 'Con saldo' : 'Pagado'}</span><ChevronRight size={20} /></Link>)}</div>}
    </section></div>
}
