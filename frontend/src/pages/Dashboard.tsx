import { useQuery } from '@tanstack/react-query';
import {
  BriefcaseIcon,
  UsersIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ScaleIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import api from '../lib/axios';
import KpiCard, { BRAND, SectionHeader, EmptyState } from '../components/dashboard/KpiCard';
import { RevenueTrendChart, AgingChart, StatusDoughnut } from '../components/dashboard/Charts';
import DeadlineHealthPanel, {
  type DeadlineHealth,
} from '../components/dashboard/DeadlineHealthPanel';
import WorkloadPanel, { type WorkloadRow } from '../components/dashboard/WorkloadPanel';
import {
  KpiSkeleton,
  ChartSkeleton,
  TableSkeleton,
  StripSkeleton,
  WidgetError,
} from '../components/dashboard/Skeletons';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatWeekdayDate,
  greeting,
  formatDaysUntil,
  formatDeadlineCountdown,
  urgencyLevel,
} from '../lib/format';

// ── Tipos do contrato da API ────────────────────────────────────────────────

interface DashboardStats {
  totalClients: number;
  totalCases: number;
  activeCases: number;
  pendingDeadlines: number;
  upcomingHearings: number;
  pendingFees: number;
  totalDocuments: number;
  totalRevenue: number;
  paidRevenue: number;
}

interface FinancialSummary {
  billed: number;
  received: number;
  receivable: number;
  overdueAmount: number;
  overdueCount: number;
  receivedThisMonth: number;
  collectionRate: number;
  totalFees: number;
  paidCount: number;
  aging: {
    aVencer: number;
    ate30: number;
    de31a60: number;
    de61a90: number;
    acima90: number;
  };
}

interface RevenuePoint {
  month: string;
  billed: number;
  received: number;
}

interface ClientRow {
  id: string;
  name: string;
  type: string;
  cpfCnpj: string;
  phone: string | null;
  _count?: { cases?: number };
}

interface DeadlineRow {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
  case?: { caseNumber: string | null } | null;
}

interface Paginated<T> {
  clients?: T[];
  deadlines?: T[];
}

/** Cores de status para a rosca de processos */
const STATUS_COLORS: Record<string, string> = {
  ATIVO: BRAND.navy600,
  ARQUIVADO: BRAND.slate400,
  SUSPENSO: BRAND.gold500,
  ENCERRADO: BRAND.gold300,
  TRANSFERIDO: BRAND.slate300,
};

// ── Hooks ───────────────────────────────────────────────────────────────────

const useDashboardQuery = <T,>(key: string[], url: string, staleMs = 30_000) =>
  useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get(url);
      return res.data.data as T;
    },
    staleTime: staleMs,
    retry: 1,
    refetchOnWindowFocus: false,
  });

export default function Dashboard() {
  const stats = useDashboardQuery<DashboardStats>(['dash-stats'], '/dashboard/stats');
  const financial = useDashboardQuery<FinancialSummary>(
    ['dash-financial'],
    '/dashboard/financial-summary',
    60_000
  );
  const trend = useDashboardQuery<RevenuePoint[]>(['dash-trend'], '/dashboard/revenue-trend', 120_000);
  const status = useDashboardQuery<{ status: string; count: number }[]>(
    ['dash-status'],
    '/dashboard/case-status-distribution',
    120_000
  );
  const deadlinesHealth = useDashboardQuery<DeadlineHealth>(
    ['dash-deadline-health'],
    '/dashboard/deadline-health'
  );
  const workload = useDashboardQuery<WorkloadRow[]>(['dash-workload'], '/dashboard/workload', 60_000);
  const clients = useDashboardQuery<Paginated<ClientRow>>(
    ['dash-clients'],
    '/clients?limit=5'
  );
  const deadlines = useDashboardQuery<Paginated<DeadlineRow>>(
    ['dash-deadlines'],
    '/deadlines?limit=6'
  );

  const fin = financial.data;
  const collectionRate = fin?.collectionRate ?? 0;

  const agingBuckets = fin
    ? [
        { label: 'A vencer', value: fin.aging.aVencer, color: BRAND.navy500 },
        { label: '1–30 dias', value: fin.aging.ate30, color: BRAND.gold400 },
        { label: '31–60 dias', value: fin.aging.de31a60, color: BRAND.gold600 },
        { label: '61–90 dias', value: fin.aging.de61a90, color: BRAND.rose500 },
        { label: '+90 dias', value: fin.aging.acima90, color: BRAND.rose600 },
      ]
    : [];

  const statusData = (status.data ?? []).map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? BRAND.slate400,
  }));

  const kpis = [
    {
      label: 'A receber',
      value: fin ? formatCurrency(fin.receivable) : '—',
      icon: BanknotesIcon,
      tone: 'navy' as const,
      hint: fin ? `${fin.overdueCount} em atraso` : undefined,
    },
    {
      label: 'Recebido no mês',
      value: fin ? formatCurrency(fin.receivedThisMonth) : '—',
      icon: ArrowTrendingUpIcon,
      tone: 'gold' as const,
      hint: fin ? `${fin.paidCount} de ${fin.totalFees} honorários pagos` : undefined,
    },
    {
      label: 'Inadimplência',
      value: fin ? formatCurrency(fin.overdueAmount) : '—',
      icon: ExclamationTriangleIcon,
      tone: fin && fin.overdueAmount > 0 ? ('rose' as const) : ('slate' as const),
      hint: fin ? (fin.overdueAmount > 0 ? 'Requer acompanhamento' : 'Nenhum valor vencido') : undefined,
    },
    {
      label: 'Taxa de cobrança',
      value: fin ? `${collectionRate.toFixed(0)}%` : '—',
      icon: ScaleIcon,
      tone: collectionRate >= 70 ? ('emerald' as const) : ('gold' as const),
      hint: fin ? `${formatCurrencyCompact(fin.received)} de ${formatCurrencyCompact(fin.billed)}` : undefined,
      progress: collectionRate,
      progressClassName:
        collectionRate >= 70
          ? 'from-emerald-400 to-emerald-600'
          : 'from-gold-400 to-gold-600',
    },
    {
      label: 'Processos ativos',
      value: stats.data ? String(stats.data.activeCases) : '—',
      icon: BriefcaseIcon,
      tone: 'navy' as const,
      hint: stats.data ? `${stats.data.totalCases} no total` : undefined,
    },
    {
      label: 'Clientes',
      value: stats.data ? String(stats.data.totalClients) : '—',
      icon: UsersIcon,
      tone: 'gold' as const,
      hint: stats.data ? `${stats.data.upcomingHearings} audiências futuras` : undefined,
    },
    {
      label: 'Documentos',
      value: stats.data ? String(stats.data.totalDocuments) : '—',
      icon: DocumentTextIcon,
      tone: 'slate' as const,
    },
    {
      label: 'Contratos ativos',
      value: stats.data ? formatCurrencyCompact(stats.data.pendingFees) : '—',
      icon: InboxIcon,
      tone: 'gold' as const,
      hint: 'Valores ainda em aberto',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {formatWeekdayDate()}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-gold dark:text-gold-light">{greeting()}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Visão consolidada do escritório</p>
          <span className="gold-rule mt-3" aria-hidden="true" />
        </div>
      </header>

      {/* Indicadores financeiros e operacionais */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {financial.isLoading || stats.isLoading
            ? Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
            : kpis.map((k) => (
                <KpiCard
                  key={k.label}
                  label={k.label}
                  value={k.value}
                  icon={k.icon}
                  tone={k.tone}
                  hint={k.hint}
                  progress={k.progress}
                  progressClassName={k.progressClassName}
                />
              ))}
        </div>
      </section>

      {/* Tendência financeira + aging */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {trend.isLoading ? (
            <ChartSkeleton />
          ) : trend.isError ? (
            <WidgetError onRetry={() => trend.refetch()} />
          ) : (
            <div className="card">
              <SectionHeader
                title="Lançado x recebido"
                subtitle="Últimos 12 meses"
              />
              <div className="mt-5 h-64">
                <RevenueTrendChart data={trend.data ?? []} />
              </div>
            </div>
          )}
        </div>

        <div>
          {financial.isLoading ? (
            <ChartSkeleton />
          ) : financial.isError ? (
            <WidgetError onRetry={() => financial.refetch()} />
          ) : (
            <div className="card">
              <SectionHeader title="Aging" subtitle="Contas a receber por prazo" />
              <div className="mt-5 h-64">
                <AgingChart data={agingBuckets} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Saúde dos prazos */}
      {deadlinesHealth.isLoading ? (
        <StripSkeleton />
      ) : deadlinesHealth.isError ? (
        <WidgetError onRetry={() => deadlinesHealth.refetch()} />
      ) : deadlinesHealth.data ? (
        <DeadlineHealthPanel data={deadlinesHealth.data} />
      ) : null}

      {/* Carga de trabalho + status dos processos */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {workload.isLoading ? (
            <TableSkeleton rows={4} />
          ) : workload.isError ? (
            <WidgetError onRetry={() => workload.refetch()} />
          ) : (
            <WorkloadPanel data={workload.data ?? []} />
          )}
        </div>

        <div>
          {status.isLoading ? (
            <ChartSkeleton />
          ) : status.isError ? (
            <WidgetError onRetry={() => status.refetch()} />
          ) : (
            <div className="card">
              <SectionHeader title="Processos por status" />
              <div className="mt-5 h-52">
                <StatusDoughnut data={statusData} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Clientes recentes + próximos prazos */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          {clients.isLoading ? (
            <TableSkeleton />
          ) : clients.isError ? (
            <WidgetError onRetry={() => clients.refetch()} />
          ) : (
            <div className="card">
              <SectionHeader title="Clientes recentes" subtitle="Últimos cadastros" />
              {(clients.data?.clients?.length ?? 0) === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    message="Nenhum cliente cadastrado ainda."
                    icon={<UsersIcon className="h-7 w-7" />}
                  />
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        {['Nome', 'Tipo', 'Telefone', 'Processos'].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.data?.clients?.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-slate-100 dark:border-slate-800 transition-colors last:border-0 hover:bg-slate-50/80"
                        >
                          <td className="px-3 py-2.5">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{c.cpfCnpj}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="badge bg-primary-50 text-primary-700">
                              {c.type === 'PESSOA_FISICA' ? 'PF' : 'PJ'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400">
                            {c.phone ?? '—'}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                            {c._count?.cases ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {deadlines.isLoading ? (
            <TableSkeleton />
          ) : deadlines.isError ? (
            <WidgetError onRetry={() => deadlines.refetch()} />
          ) : (
            <div className="card">
              <SectionHeader title="Próximos prazos" subtitle="Exigências mais próximas" />
              {(deadlines.data?.deadlines?.length ?? 0) === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    message="Nenhum prazo em aberto."
                    icon={<BriefcaseIcon className="h-7 w-7" />}
                  />
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {deadlines.data?.deadlines?.map((d) => {
                    const days = formatDaysUntil(d.dueDate);
                    const level = urgencyLevel(days, d.isCompleted);

                    const styles: Record<string, string> = {
                      overdue: 'border-rose-200 bg-rose-50/70 text-rose-700',
                      today: 'border-amber-200 bg-amber-50/70 text-amber-700',
                      soon: 'border-gold-200 bg-gold-50/70 text-gold-700',
                      upcoming: 'border-slate-200 bg-slate-50/70 text-slate-600',
                      done: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
                    };

                    return (
                      <li
                        key={d.id}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-transform duration-200 hover:-translate-y-px ${styles[level]}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          <p className="truncate text-xs opacity-70">
                            {d.case?.caseNumber ?? 'Sem processo'} · {formatDate(d.dueDate)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold">
                          {formatDeadlineCountdown(days)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}