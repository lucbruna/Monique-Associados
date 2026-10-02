import { BriefcaseIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { EmptyState } from './KpiCard';
import { formatNumber } from '../../lib/format';

export interface WorkloadRow {
  id: string;
  name: string;
  oab: string | null;
  role: string;
  activeCases: number;
  openDeadlines: number;
  overdueDeadlines: number;
}

function initials(name: string): string {
  return name
    .replace(/\b(dra?|dr|profs?)\.?\s+/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Distribuição de carga por advogado.
 * O maior volume vira a barra de referência, então a comparação é imediata —
 * quem está sobrecarregado aparece antes de alguém ler os números.
 */
export default function WorkloadPanel({ data }: { data: WorkloadRow[] }) {
  const max = data.reduce((acc, r) => Math.max(acc, r.activeCases), 0);
  const relevantes = data.filter((r) => r.activeCases > 0 || r.openDeadlines > 0);

  return (
    <section className="card">
      <header className="mb-5">
        <h2 className="text-lg text-slate-900 dark:text-slate-100">Carga de trabalho</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Processos ativos e prazos em aberto por advogado
        </p>
      </header>

      {relevantes.length === 0 ? (
        <EmptyState
          message="Nenhum processo ativo no momento."
          icon={<BriefcaseIcon className="h-7 w-7" />}
        />
      ) : (
        <ul className="space-y-4">
          {relevantes.map((row) => {
            const pct = max > 0 ? (row.activeCases / max) * 100 : 0;
            const sobrecarregado = row.overdueDeadlines > 0;

            return (
              <li key={row.id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ sobrecarregado ? 'bg-rose-100 text-rose-700' : 'bg-primary-50 text-primary-700' }`}
                  >
                    {initials(row.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{row.name}</p>
                      <p className="shrink-0 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatNumber(row.activeCases)} proc.
                      </p>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-out ${ sobrecarregado ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-primary-500 to-primary-700' }`}
                          style={{ width: `${Math.max(pct, row.activeCases > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatNumber(row.openDeadlines)} prazos
                      </span>
                    </div>
                  </div>

                  {sobrecarregado && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
                      title={`${row.overdueDeadlines} prazo(s) em atraso`}
                    >
                      <ExclamationTriangleIcon className="h-3 w-3" />
                      {row.overdueDeadlines}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}