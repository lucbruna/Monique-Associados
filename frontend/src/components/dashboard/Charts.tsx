import { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
  type TooltipItem,
} from 'chart.js';
import { BRAND } from './KpiCard';
import { formatCurrency, formatCurrencyCompact } from '../../lib/format';
import { useTheme } from '../../hooks/useTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  ArcElement
);

ChartJS.defaults.font.family = "'Plus Jakarta Sans', Inter, system-ui, sans-serif";
ChartJS.defaults.color = BRAND.slate500;

/**
 * Cores do Chart.js por tema. O canvas nao enxerga classes do Tailwind, entao
 * e aqui que a virada de tema acontece para eixos, legenda e tooltip.
 */
function useChartPalette() {
  const { tema } = useTheme();
  const escuro = tema === 'dark';
  return {
    grade: escuro ? 'rgba(148, 163, 184, 0.22)' : 'rgba(148, 163, 184, 0.16)',
    tick: escuro ? BRAND.slate300 : BRAND.slate400,
    tickForte: escuro ? BRAND.slate300 : BRAND.slate600,
    legenda: escuro ? BRAND.slate400 : BRAND.slate500,
    // No escuro o tooltip precisa de contorno, senao some no card.
    tooltipBg: escuro ? '#0b1220' : BRAND.navy900,
    tooltipBorda: escuro ? 'rgba(212, 175, 55, 0.38)' : 'rgba(255, 255, 255, 0.14)',
    // Cor do fundo do card: separa as fatias da rosquinha.
    separador: escuro ? '#0f172a' : '#ffffff',
  };
}

interface RevenuePoint {
  month: string;
  billed: number;
  received: number;
}

/**
 * Lançado x recebido nos últimos 12 meses.
 * Navy para o contratado e ouro para o que entrou em caixa: o contraste entre
 * "o que foi lançado" e "o que foi efetivamente recebido" fica legível de
 * relance, que é a leitura que o sócio faz ao abrir o sistema.
 */
export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const paleta = useChartPalette();
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: 'Lançado',
          data: data.map((d) => d.billed),
          backgroundColor: 'rgba(35, 74, 122, 0.85)',
          hoverBackgroundColor: BRAND.navy600,
          borderRadius: 6,
          borderSkipped: false as const,
          maxBarThickness: 22,
        },
        {
          label: 'Recebido',
          data: data.map((d) => d.received),
          backgroundColor: BRAND.gold400,
          hoverBackgroundColor: BRAND.gold500,
          borderRadius: 6,
          borderSkipped: false as const,
          maxBarThickness: 22,
        },
      ],
    }),
    [data]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 7,
            boxHeight: 7,
            padding: 16,
            color: paleta.legenda,
            font: { size: 12, weight: 600 },
          },
        },
        tooltip: {
          backgroundColor: paleta.tooltipBg,
          borderColor: paleta.tooltipBorda,
          borderWidth: 1,
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          padding: 12,
          cornerRadius: 10,
          boxPadding: 4,
          callbacks: {
            label: (ctx: TooltipItem<'bar'>) =>
              ` ${ctx.dataset.label ?? 'Valor'}: ${formatCurrency(ctx.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: paleta.tick, font: { size: 11 }, maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          grid: { color: paleta.grade },
          border: { display: false },
          ticks: {
            color: paleta.tick,
            font: { size: 11 },
            callback: (value: string | number) => formatCurrencyCompact(Number(value)),
          },
        },
      },
    }),
    [paleta]
  );

  return <Bar data={chartData} options={options} />;
}

interface AgingBucket {
  label: string;
  value: number;
  color: string;
}

/**
 * Aging de contas a receber — barras horizontais.
 * A cor carrega a urgência: navy para o que ainda vai vencer e tons
 * progressivamente mais quentes até o rose do que está muito atrasado.
 */
export function AgingChart({ data }: { data: AgingBucket[] }) {
  const paleta = useChartPalette();
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          label: 'A receber',
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color),
          borderRadius: 6,
          borderSkipped: false as const,
          maxBarThickness: 22,
        },
      ],
    }),
    [data]
  );

  const options = useMemo(
    () => ({
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: paleta.tooltipBg,
          borderColor: paleta.tooltipBorda,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx: TooltipItem<'bar'>) => ` ${formatCurrency(ctx.parsed.x ?? 0)}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: paleta.grade },
          border: { display: false },
          ticks: {
            color: paleta.tick,
            font: { size: 11 },
            callback: (value: string | number) => formatCurrencyCompact(Number(value)),
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: paleta.tickForte, font: { size: 11, weight: 600 } },
        },
      },
    }),
    [paleta]
  );

  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        Nenhum valor a receber
      </div>
    );
  }

  return <Bar data={chartData} options={options} />;
}

interface StatusPoint {
  label: string;
  value: number;
  color: string;
}

export function StatusDoughnut({ data }: { data: StatusPoint[] }) {
  const paleta = useChartPalette();
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color),
          borderColor: paleta.separador,
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [data, paleta]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 7,
            boxHeight: 7,
            padding: 14,
            color: paleta.legenda,
            font: { size: 11, weight: 600 },
          },
        },
        tooltip: {
          backgroundColor: paleta.tooltipBg,
          borderColor: paleta.tooltipBorda,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          callbacks: {
            label: (ctx: TooltipItem<'doughnut'>) => ` ${ctx.label}: ${ctx.parsed}`,
          },
        },
      },
    }),
    [paleta]
  );

  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">
        Nenhum processo cadastrado
      </div>
    );
  }

  return <Doughnut data={chartData} options={options} />;
}