/**
 * Esqueletos de carregamento por widget.
 * O dashboard antigo bloqueava a página inteira até o último request
 * responder; agora cada região carrega o seu próprio esqueleto.
 */

const shimmer = 'animate-pulse rounded-lg bg-slate-200/70';

export function KpiSkeleton() {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`${shimmer} h-3 w-24`} />
        <div className={`${shimmer} h-10 w-10 rounded-xl`} />
      </div>
      <div>
        <div className={`${shimmer} h-7 w-32`} />
        <div className={`${shimmer} mt-2 h-3 w-20`} />
      </div>
      <div className={`${shimmer} mt-auto h-1.5 w-full`} />
    </div>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className="card">
      <div className={`${shimmer} mb-6 h-4 w-40`} />
      <div className={`${shimmer} w-full ${height}`} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      <div className={`${shimmer} mb-6 h-4 w-44`} />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`${shimmer} h-4 flex-1`} />
            <div className={`${shimmer} h-4 w-24`} />
            <div className={`${shimmer} h-4 w-20`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Faixa horizontal usada no painel de saúde dos prazos */
export function StripSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="card">
      <div className={`${shimmer} mb-6 h-4 w-40`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 p-4">
            <div className={`${shimmer} h-6 w-10`} />
            <div className={`${shimmer} mt-2 h-3 w-16`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Erro de carregamento com opção de tentar de novo */
export function WidgetError({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-10 text-center">
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary text-sm">
          Tentar novamente
        </button>
      )}
    </div>
  );
}