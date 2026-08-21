import { Construction } from 'lucide-react'

export function ModulePlaceholderPage({ title }) {
  return <div className="page-stack"><header className="page-header"><span className="eyebrow">Módulo preparado</span><h1>{title}</h1><p>La navegación y estructura están listas.</p></header><section className="empty-state"><span className="empty-state__icon"><Construction size={28} /></span><h2>Disponible en una próxima etapa</h2><p>Este módulo se implementará siguiendo el orden definido en el prompt maestro.</p></section></div>
}
