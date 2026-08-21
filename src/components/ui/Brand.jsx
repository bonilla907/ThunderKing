import logo from '../../assets/logo/thunderking-logo-optimized.png'

export function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand--compact' : ''}`}><img className="brand__logo" src={logo} alt="Thunder King — Estampados en textiles" />{!compact && <div className="brand__text"><strong>ThunderKing</strong><span>Gestión de pedidos</span></div>}</div>
}
