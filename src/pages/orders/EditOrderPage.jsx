import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { OrderForm } from '../../components/orders/OrderForm'
import { listClients } from '../../services/clientsService'
import { getOrder, updateOrder } from '../../services/ordersService'
import { timestampToInput } from '../../utils/formatters'

export function EditOrderPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [clients, setClients] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([getOrder(orderId), listClients()]).then(([orderData, clientData]) => { setOrder(orderData); setClients(clientData) }).catch((e) => setError(e.message)) }, [orderId])
  if (error) return <div className="alert alert--error">{error}</div>
  if (!order) return <div className="inline-loader"><span className="spinner" />Cargando pedido...</div>
  const initialData = { client: { Nombre: order.Cliente.Nombre, Telefono: order.Cliente.Telefono }, deliveryDate: timestampToInput(order.FechaEntrega), concepts: order.Conceptos.map((item) => ({ Cantidad: item.Cantidad, Descripcion: item.Descripcion, PrecioUnitario: item.PrecioUnitario })), totalPaid: Number(order.TotalPagado) || 0 }
  const handleSubmit = async (values) => { await updateOrder(orderId, values); navigate(`/pedidos/${orderId}`, { replace: true, state: { success: `Pedido #${order.NumeroPedido} actualizado correctamente.` } }) }
  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Edición</span><h1>Editar pedido #{order.NumeroPedido}</h1><p>Actualiza cliente, conceptos o fecha de entrega sin perder el registro.</p></header><OrderForm initialData={initialData} clients={clients} onSubmit={handleSubmit} submitLabel="Guardar cambios" /></div>
}
