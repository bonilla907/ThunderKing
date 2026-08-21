import { CalendarCheck, CalendarClock, ChevronRight, ClipboardList, Clock3, Plus, Search, Sunrise, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listOrders } from '../../services/ordersService'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { getOrderTiming, getTimingMessage, ORDER_CATEGORIES } from '../../utils/orderCategories'
import { formatPhone } from '../../utils/phone'

const categoryIcons = { en_proceso: Clock3, proximo: CalendarClock, manana: Sunrise, hoy: CalendarCheck, atrasado: TriangleAlert }

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const requestedCategory = searchParams.get('categoria')
  const [category, setCategory] = useState(ORDER_CATEGORIES.some((item) => item.id === requestedCategory) ? requestedCategory : 'todos')
  const selectCategory = (value) => { setCategory(value); setSearchParams(value === 'todos' ? {} : { categoria: value }, { replace: true }) }

  useEffect(() => { listOrders(300).then(setOrders).catch(() => setError('No fue posible cargar los pedidos.')).finally(() => setLoading(false)) }, [])

  const pendingOrders = useMemo(() => orders.filter((order) => order.Estado === 'pendiente').map((order) => ({ ...order, timing: getOrderTiming(order) })).sort((a, b) => (a.FechaEntrega?.toMillis?.() || 0) - (b.FechaEntrega?.toMillis?.() || 0)), [orders])
  const counts = useMemo(() => Object.fromEntries(ORDER_CATEGORIES.map((item) => [item.id, pendingOrders.filter((order) => order.timing.category === item.id).length])), [pendingOrders])
  const term = search.trim().toLocaleLowerCase('es-MX')
  const digits = search.replace(/\D/g, '')
  const filtered = pendingOrders.filter((order) => (category === 'todos' || order.timing.category === category) && (!term || String(order.NumeroPedido).includes(term) || order.Cliente?.Nombre?.toLocaleLowerCase('es-MX').includes(term) || (digits && order.Cliente?.Telefono?.includes(digits))))

  return <div className="page-stack"><header className="page-header page-header--action"><div><span className="eyebrow">Seguimiento por fecha</span><h1>Pedidos</h1><p>Prioriza el trabajo según los días restantes para la entrega.</p></div><Link className="primary-button primary-button--inline" to="/pedidos/nuevo"><Plus size={18} />Nuevo pedido</Link></header>
    <section className="category-tabs" aria-label="Categorías de pedidos"><button type="button" className={category === 'todos' ? 'active' : ''} onClick={() => selectCategory('todos')}><ClipboardList size={18} /><span>Todos</span><strong>{pendingOrders.length}</strong></button>{ORDER_CATEGORIES.map((item) => { const Icon = categoryIcons[item.id]; return <button type="button" key={item.id} className={`${category === item.id ? 'active' : ''} category-tab--${item.id}`} onClick={() => selectCategory(item.id)}><Icon size={18} /><span>{item.label}</span><strong>{counts[item.id]}</strong></button> })}</section>
    <section className="content-card"><div className="list-toolbar"><div className="input-with-icon search-input"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, cliente o teléfono" /></div><span>{filtered.length} pedido{filtered.length === 1 ? '' : 's'}</span></div>
      {error && <div className="alert alert--error">{error}</div>}{loading ? <div className="inline-loader"><span className="spinner" />Cargando pedidos...</div> : filtered.length === 0 ? <div className="empty-list"><ClipboardList size={30} /><h2>No hay pedidos en esta categoría</h2><p>{search ? 'Prueba con otra búsqueda.' : 'Los pedidos aparecerán automáticamente según su fecha.'}</p></div> : <div className="orders-card-list">{filtered.map((order) => <OrderCard key={order.id} order={order} />)}</div>}
    </section></div>
}

function OrderCard({ order }) {
  const Icon = categoryIcons[order.timing.category]
  return <Link className={`order-card order-card--${order.timing.category}`} to={`/pedidos/${order.id}`}>
    <div className="order-card__status"><span><Icon size={20} /></span><div><small>Pedido</small><strong>#{order.NumeroPedido}</strong></div></div>
    <div className="order-card__client"><strong>{order.Cliente?.Nombre}</strong><span>{formatPhone(order.Cliente?.Telefono)}</span></div>
    <div className="order-card__date"><small>Fecha de entrega</small><strong>{formatDate(order.FechaEntrega)}</strong><span>{getTimingMessage(order.timing)}</span></div>
    <div className="order-card__money"><div><small>Total</small><strong>{formatCurrency(order.Total)}</strong></div><div><small>Saldo</small><strong>{formatCurrency(order.Saldo)}</strong></div></div>
    <span className={`category-badge category-badge--${order.timing.category}`}>{order.timing.label}</span><ChevronRight className="order-card__arrow" size={21} />
  </Link>
}
