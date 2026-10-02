import type { ComponentType, ReactNode } from 'react';

/** Paleta de marca — espelha tailwind.config.js (navy + gold) */
export const BRAND = {
  navy900: '#162b45',
  navy700: '#1d3c63',
  navy600: '#234a7a',
  navy500: '#2f5e94',
  gold600: '#a87a2d',
  gold500: '#c2973a',
  gold400: '#d1ab52',
  gold300: '#ddc47c',
  gold100: '#f4eed6',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  rose600: '#e11d48',
  rose500: '#f43f5e',
  rose100: '#ffe4e6',
  emerald600: '#059669',
  emerald100: '#d1fae5',
} as const;

/** Chips de ícone dos KPIs — só tons da marca, exceto alerta financeiro */
export type Tone = 'navy' | 'gold' | 'emerald' | 'rose' | 'slate';

export const TONE_CHIP: Record<Tone, string> = {
  navy: 'bg-primary-600 text-white shadow-[0_6px_18px_-6px_rgba(35,74,122,0.65)]',
  gold: 'bg-gradient-to-br from-gold-300 via-gold-400 to-gold-600 text-[#241a05] shadow-glow',
  emerald: 'bg-emerald-600 text-white shadow-[0_6px_18px_-6px_rgba(5,150,105,0.6)]',
  rose: 'bg-rose-600 text-white shadow-[0_6px_18px_-6px_rgba(225,29,72,0.6)]',
  slate: 'bg-slate-500 text-white shadow-[0_6px_18px_-6px_rgba(100,116,139,0.55)]',
};

interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: Tone;
  /** Linha de contexto abaixo do número (delta, observação, contador) */
  hint?: ReactNode;
  /** Barra de progresso opcional, 0–100 */
  progress?: number;
  progressClassName?: string;
}

/**
 * Card de indicador. O rótulo em caixa alta com tracking largo cria a
 * hierarquia editorial do dashboard; o número fica em sans para leitura
 * de valores, e a barra de progresso dá noção de escala sem ruído.
 */
export default function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'navy',
  hint,
  progress,
  progressClassName = 'from-gold-400 to-gold-600',
}: KpiCardProps) {
  const clamped = Math.max(0, Math.min(100, progress ?? 0));
  const showProgress = progress !== undefined;

  return (
    <div className="card group flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div
          className={`shrink-0 rounded-xl p-2.5 transition-transform duration-200 group-hover:scale-105 ${TONE_CHIP[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div>
        <p className="text-[26px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>

      {showProgress && (
        <div className="mt-auto">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out ${progressClassName}`}
              style={{ width: `${clamped}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Cabeçalho de seção com filete dourado, alinhado ao .gold-rule global */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Bloco vazio elegante — nunca mostrar "N/A" cru na tela */
export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 px-4 py-8 text-center">
      {icon && <div className="text-slate-300 dark:text-slate-400">{icon}</div>}
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}