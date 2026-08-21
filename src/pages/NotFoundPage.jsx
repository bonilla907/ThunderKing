import { Link } from 'react-router-dom'
export function NotFoundPage() { return <main className="full-page-state"><span className="error-code">404</span><h1>Página no encontrada</h1><p>La dirección solicitada no existe.</p><Link className="primary-button primary-button--inline" to="/dashboard">Volver al inicio</Link></main> }
