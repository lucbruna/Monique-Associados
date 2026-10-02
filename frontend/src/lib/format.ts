/**
 * Formatadores centralizados de moeda, número e data.
 * Evitam a duplicação de `toLocaleString` espalhada pelas páginas.
 */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlCompact = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** R$ 1.234,56 */
export const formatCurrency = (value: number | null | undefined): string =>
  brl.format(Number(value ?? 0));

/** R$ 12,3 mil — para eixos de gráfico e valores compactos */
export const formatCurrencyCompact = (value: number | null | undefined): string =>
  brlCompact.format(Number(value ?? 0));

/** 1.234 */
export const formatNumber = (value: number | null | undefined): string =>
  new Intl.NumberFormat('pt-BR').format(Number(value ?? 0));

/** 12/10/2026 */
export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d);
};

/** 12 de outubro de 2026 */
export const formatDateLong = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
};

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Segunda-feira, 2 de outubro */
export const formatWeekdayDate = (value: Date = new Date()): string => {
  const dia = DIAS_SEMANA[value.getDay()];
  const diaNum = value.getDate();
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(value);
  return `${dia}, ${diaNum} de ${mes}`;
};

/** Saudação conforme o horário */
export const greeting = (value: Date = new Date()): string => {
  const h = value.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

/** 1 dia / 0 dias / -3 dias */
export const formatDaysUntil = (date: string | Date): number => {
  const target = date instanceof Date ? date : new Date(date);
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startOfTarget.getTime() - startOfNow.getTime()) / 86_400_000);
};

/** Prazo em dias, já com o plural correto e o "hoje" especial */
export const formatDeadlineCountdown = (days: number): string => {
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days === -1) return 'ontem';
  if (days < 0) return `${Math.abs(days)} dias em atraso`;
  return `${days} dias`;
};

/** Hierarquia de cor por urgência de prazo */
export type UrgencyLevel = 'overdue' | 'today' | 'soon' | 'upcoming' | 'done';

export const urgencyLevel = (days: number, isCompleted = false): UrgencyLevel => {
  if (isCompleted) return 'done';
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'upcoming';
};