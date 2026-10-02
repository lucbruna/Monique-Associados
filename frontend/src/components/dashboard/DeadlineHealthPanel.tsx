import {
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  SunIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from './KpiCard';
import { formatNumber } from '../../lib/format';

export interface DeadlineHealth {
  overdue: number;
  dueToday: number;
  next3: number;
  next7: number;
  later: number;
  open: number;
  total: number;
  completed: number;
  complianceRate: number;
}

interface Metric {
  key: string;
  label: string;
  value: number;
  icon: typeof ClockIcon;
  cardClass: string;
  iconClass: string;
}

/**
 * Distribuição dos prazos por临proximidade.
 * A escala de cor vai do rose (atrasado) ao gold (próximos) e o cinza
 * (mais adiante), para que o olho encontre o risco sem ler os números.
 */
export default function DeadlineHealthPanel({ data }: { data: DeadlineHealth }) {
  const metrics: Metric[] = [
    {
      key: 'overdue',
      label: 'Em atraso',
      value: data.overdue,
      icon: ExclamationTriangleIcon,
      cardClass: 'border-rose-500/30 bg-rose-500/10',
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      key: 'today',
      label: 'Para hoje',
      value: data.dueToday,
      icon: FireIcon,
      cardClass: 'border-amber-500/30 bg-amber-500/10',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'next3',
      label: 'Próximos 3 dias',
      value: data.next3,
      icon: SunIcon,
      cardClass: 'border-gold-700/40 bg-gold-500/10',
      iconClass: 'text-gold-600 dark:text-gold-400',
    },
    {
      key: 'next7',
      label: 'Próximos 7 dias',
      value: data.next7,
      icon: CalendarDaysIcon,
      cardClass: 'border-slate-700/70 bg-slate-800/50',
      iconClass: 'text-slate-500 dark:text-slate-400',
    },
    {
      key: 'later',
      label: 'Mais adiante',
      value: data.later,
      icon: ClockIcon,
      cardClass: 'border-slate-700/70 bg-slate-800/50',
      iconClass: 'text-slate-500 dark:text-slate-400',
    },
  ];

  return (
    <section className="card">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg text-slate-900 dark:text-slate-100">Saúde dos prazos</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400">
            {formatNumber(data.open)} em aberto de {formatNumber(data.total)} registrados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 dark:text-slate-400">
              Conclusão
            </p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
              {data.complianceRate.toFixed(0)}%
            </p>
          </div>
          <div className="h-10 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600" />
        </div>
      </header>

      {data.total === 0 ? (
        <EmptyState message="Nenhum prazo cadastrado ainda." icon={<ClockIcon className="h-7 w-7" />} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <div
              key={m.key}
              className={`rounded-xl border p-4 transition-transform duration-200 hover:-translate-y-0.5 ${m.cardClass}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-400">
                  {m.label}
                </p>
                <m.icon className={`h-4 w-4 shrink-0 ${m.iconClass}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                {formatNumber(m.value)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}