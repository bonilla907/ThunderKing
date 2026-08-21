import { Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listClients } from '../../services/clientsService'
import { formatDate } from '../../utils/formatters'
import { formatPhone } from '../../utils/phone'

export function ClientsPage() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { listClients().then(setClients).catch(() => setError('No fue posible cargar los clientes.')).finally(() => setLoading(false)) }, [])
  const term = search.trim().toLocaleLowerCase('es-MX')
  const digits = search.replace(/\D/g, '')
  const filtered = clients.filter((client) => !term || client.Nombre?.toLocaleLowerCase('es-MX').includes(term) || (digits && client.Telefono?.includes(digits)))
  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Directorio</span><h1>Clientes</h1><p>Los clientes se registran al guardar su primer pedido y se reutilizan automáticamente.</p></header><section className="content-card"><div className="list-toolbar"><div className="input-with-icon search-input"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o teléfono" /></div><span>{filtered.length} cliente{filtered.length === 1 ? '' : 's'}</span></div>
    {error && <div className="alert alert--error">{error}</div>}{loading ? <div className="inline-loader"><span className="spinner" />Cargando clientes...</div> : filtered.length === 0 ? <div className="empty-list"><Users size={30} /><h2>No hay clientes para mostrar</h2><p>Se crearán automáticamente desde Nuevo pedido.</p></div> : <div className="client-grid">{filtered.map((client) => <article className="client-card" key={client.id}><span className="client-card__avatar"><UserPlus size={21} /></span><div><h2>{client.Nombre}</h2><p>{formatPhone(client.Telefono)}</p><small>Actualizado: {formatDate(client.FechaActualizacion || client.FechaCreacion)}</small></div></article>)}</div>}
  </section></div>
}
