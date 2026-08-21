import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OrderForm } from '../../components/orders/OrderForm'
import { useAuth } from '../../hooks/useAuth'
import { listClients } from '../../services/clientsService'
import { createOrder } from '../../services/ordersService'

export function NewOrderPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  useEffect(() => { listClients().then(setClients).catch(() => setClients([])) }, [])
  const handleSubmit = async (values) => {
    const order = await createOrder({ ...values, userId: user.uid, userName: profile?.Nombre || user.email })
    navigate(`/pedidos/${order.id}`, { replace: true, state: { success: `Pedido #${order.NumeroPedido} guardado correctamente.` } })
  }
  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Registro</span><h1>Nuevo pedido</h1><p>Captura al cliente, sus conceptos, pago inicial y fecha de entrega.</p></header><OrderForm clients={clients} onSubmit={handleSubmit} allowInitialPayment /></div>
}
