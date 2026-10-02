import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  BriefcaseIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Clientes', href: '/clients', icon: UsersIcon },
  { name: 'Processos', href: '/cases', icon: BriefcaseIcon },
  { name: 'Agenda', href: '/calendar', icon: CalendarIcon },
  { name: 'Documentos', href: '/documents', icon: DocumentTextIcon },
  { name: 'Constituição Federal', href: '/constituicao-federal', icon: ScaleIcon },
  { name: 'Vade-Mécum', href: '/vade-mecum', icon: BookOpenIcon },
  { name: 'Prazos', href: '/deadlines', icon: ClockIcon },
  { name: 'Honorários', href: '/fees', icon: CurrencyDollarIcon },
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    // shrink-0: sem isso a sidebar encolhe quando o conteúdo aperta.
    // min-h-0 no nav é o que faz o scroll ficar DENTRO da aba: sem ele o
    // flex-item assume altura do conteúdo e os itens abaixo de "Prazos"
    // ficam inalcançáveis em telas de notebook.
    <div className="w-64 shrink-0 bg-dark-800 text-white flex flex-col min-h-0">
      <div className="p-6 border-b border-dark-700 shrink-0">
        <h1 className="text-xl font-display font-light text-gold-light tracking-[0.12em]">
          <span className="mr-2">⚖️</span>Monique Associados
        </h1>
        <p className="text-sm text-gray-400 mt-1">Gestão Advocatícia</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 overscroll-contain">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5 text-gold-400 shrink-0" />
              <span className="font-display font-light tracking-[0.14em] text-gold-light">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dark-700 shrink-0">
        <div className="text-xs text-gray-400">
          <p>&copy; 2026 Monique Associados</p>
          <p className="mt-1">v1.0.1</p>
        </div>
      </div>
    </div>
  );
}
