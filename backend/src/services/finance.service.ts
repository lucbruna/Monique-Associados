/**
 * Regras de negócio do módulo financeiro.
 *
 * Toda a aritmética monetária é feita em centavos (inteiros). Somar e dividir
 * `Float` de duas casas acumula erro binário — R$ 100 em 3 parcelas daria
 * 33,33 + 33,33 + 33,33 = 99,99 e o escritório ficaria com R$ 0,01 a
 * receber que não existe. Por isso o arredondamento é feito uma única vez,
 * sobre inteiros, e a diferença vai para a última parcela.
 */

import prisma from '../config/database';

export const INSTALLMENT_STATUS = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  ATRASADO: 'ATRASADO',
} as const;

export type InstallmentStatus = (typeof INSTALLMENT_STATUS)[keyof typeof INSTALLMENT_STATUS];

export const FEE_STATUS = {
  PENDENTE: 'PENDENTE',
  PARCELADO: 'PARCELADO',
  PAGO: 'PAGO',
  ATRASADO: 'ATRASADO',
} as const;

export const PAYMENT_METHODS = [
  'PIX',
  'BOLETO',
  'DINHEIRO',
  'TRANSFERENCIA',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'CHEQUE',
  'OUTRO',
] as const;

export const EXPENSE_CATEGORIES = [
  'ALUGUEL',
  'PESSOAL',
  'MATERIAL_ESCRITORIO',
  'MARKETING',
  'SOFTWARE',
  'IMPOSTO',
  'ENERGIA_INTERNET',
  'CONTABILIDADE',
  'BANCOS',
  'PROCESSOS_CUSTAS',
  'OUTROS',
] as const;

/** Converte reais em centavos inteiros. */
const toCents = (value: number): number => Math.round(Number(value) * 100);

/** Converte centavos inteiros de volta para reais. */
const toReais = (cents: number): number => Math.round(cents) / 100;

/**
 * Reparte um valor em N parcelas cuja soma é EXATAMENTE o valor original.
 * Ex.: 10000 em 3 → [3334, 3333, 3333] centavos, somando 10000.
 */
export function splitAmount(total: number, count: number): number[] {
  const totalCents = toCents(total);
  const n = Math.floor(count);

  if (!Number.isFinite(totalCents) || totalCents <= 0) throw new Error('Valor total deve ser positivo');
  if (!Number.isInteger(n) || n < 1) throw new Error('Número de parcelas deve ser no mínimo 1');
  if (n > 240) throw new Error('Máximo de 240 parcelas');
  if (totalCents < n) throw new Error('Não é possível dividir o valor em mais parcelas que o total em centavos');

  const base = Math.floor(totalCents / n);
  const remainder = totalCents - base * n;

  // As primeiras parcelas recebem a parte inteira; a última absorve o resto.
  const parts = new Array(n).fill(base);
  parts[n - 1] += remainder;

  return parts.map(toReais);
}

/**
 * Soma valores monetários com segurança.
 *
 * Aceita tanto números avulsos quanto registros com `amount`, porque quem
 * chama costuma ter as duas formas à mão. O acúmulo é feito em centavos para
 * não acumular o erro binário do Float a cada parcela somada.
 */
export function sumInstallments(values: Array<number | { amount: number }>): number {
  // Acumulador tipado explicitamente: sem isso o TypeScript infere o tipo da
  // união e rejeita a soma com o valor do campo `amount`.
  const cents = values.reduce<number>((acc, v) => {
    const amount = typeof v === 'number' ? v : v.amount;
    return acc + toCents(amount);
  }, 0);

  return toReais(cents);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export interface GenerateInstallmentsInput {
  feeId: string;
  /** Quantidade de parcelas */
  count: number;
  /** Vencimento da primeira parcela */
  firstDueDate: string | Date;
  /** Espaçamento entre vencimentos: em dias ou meses */
  interval: number;
  unit: 'DAYS' | 'MONTHS';
  /** Sobrescreve o valor total; padrão é o valor do honorário */
  totalAmount?: number;
}

/**
 * Gera as parcelas de um honorário. Substitui integralmente as parcelas
 * anteriores do mesmo honorário para não duplicar cobrança.
 */
export async function generateInstallments(input: GenerateInstallmentsInput) {
  const fee = await prisma.fee.findUnique({ where: { id: input.feeId } });
  if (!fee) throw new Error('Honorário não encontrado');

  const total = input.totalAmount ?? fee.amount;
  const amounts = splitAmount(total, input.count);
  const start = new Date(input.firstDueDate);

  const rows = amounts.map((amount, index) => {
    const dueDate = input.unit === 'MONTHS' ? addMonths(start, index) : new Date(start);
    if (input.unit === 'DAYS') dueDate.setDate(dueDate.getDate() + index * input.interval);

    return {
      feeId: fee.id,
      number: index + 1,
      amount,
      dueDate,
      status: INSTALLMENT_STATUS.PENDENTE,
    };
  });

  return prisma.$transaction(async (tx) => {
    await tx.installment.deleteMany({ where: { feeId: fee.id } });
    await tx.installment.createMany({ data: rows });
    return tx.installment.findMany({
      where: { feeId: fee.id },
      orderBy: { number: 'asc' },
    });
  });
}

/** Marca as parcelas vencidas como ATRASADO. */
export async function refreshOverdueInstallments(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await prisma.installment.updateMany({
    where: { status: INSTALLMENT_STATUS.PENDENTE, dueDate: { lt: today } },
    data: { status: INSTALLMENT_STATUS.ATRASADO },
  });

  return count;
}

/**
 * Deriva o status do honorário a partir das parcelas.
 *
 * Sem parcelas, o honorário se comporta como uma cobrança única: PAGO quando
 * pago e ATRASADO quando venceu. Com parcelas, o status reflete o conjunto:
 * tudo pago → PAGO, tudo pendente → PENDENTE, misto → PARCELADO, e ATRASADO
 * quando existir parcela vencida e nada tiver sido pago.
 */
export async function syncFeeStatusFromInstallments(feeId: string): Promise<void> {
  const installments = await prisma.installment.findMany({
    where: { feeId },
    select: { status: true, paidDate: true },
  });

  const fee = await prisma.fee.findUnique({ where: { id: feeId } });
  if (!fee) return;

  let status: string;
  if (installments.length === 0) {
    status = fee.status === FEE_STATUS.PAGO ? FEE_STATUS.PAGO : fee.status;
  } else {
    const paid = installments.filter((i) => i.status === INSTALLMENT_STATUS.PAGO).length;
    const overdue = installments.filter((i) => i.status === INSTALLMENT_STATUS.ATRASADO).length;
    const open = installments.length - paid;

    if (open === 0) status = FEE_STATUS.PAGO;
    else if (paid === 0 && overdue > 0) status = FEE_STATUS.ATRASADO;
    else if (paid > 0) status = FEE_STATUS.PARCELADO;
    else status = FEE_STATUS.PENDENTE;
  }

  if (status === fee.status) return;

  // paidDate acompanha o status, como já fazia o controller de honorários: sem
  // isto um honorário parcelado e quitado ficaria PAGO sem data e nunca
  // entraria na RECEITA REAL nem na tendência de lançamento x recebido.
  const data: { status: string; paidDate?: Date | null } = { status };

  if (status === FEE_STATUS.PAGO) {
    if (!fee.paidDate) {
      // Data da liquidação é o último pagamento efetivamente registrado.
      const paidDates = installments
        .map((i) => i.paidDate)
        .filter((d): d is Date => d !== null);
      data.paidDate = paidDates.length > 0 ? new Date(Math.max(...paidDates.map((d) => d.getTime()))) : new Date();
    }
  } else if (fee.status === FEE_STATUS.PAGO) {
    data.paidDate = null;
  }

  await prisma.fee.update({ where: { id: feeId }, data });
}

/**
 * Dá baixa numa parcela e propaga o status para o honorário.
 * `paidDate` explícito permite lançar pagamento com data retroativa.
 */
export async function payInstallment(
  installmentId: string,
  data: { paidDate?: Date | null; method?: string; reference?: string; notes?: string }
) {
  const installment = await prisma.installment.findUnique({ where: { id: installmentId } });
  if (!installment) throw new Error('Parcela não encontrada');

  const paidDate = data.paidDate ?? new Date();

  await prisma.installment.update({
    where: { id: installmentId },
    data: {
      status: INSTALLMENT_STATUS.PAGO,
      paidDate,
      ...(data.method !== undefined ? { method: data.method } : {}),
      ...(data.reference !== undefined ? { reference: data.reference } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });

  await syncFeeStatusFromInstallments(installment.feeId);

  return prisma.installment.findUnique({
    where: { id: installmentId },
    include: { fee: { include: { case: { include: { client: true } } } } },
  });
}

/** Reabre uma parcela, devolvendo-a para pendente. */
export async function reopenInstallment(installmentId: string) {
  const installment = await prisma.installment.findUnique({ where: { id: installmentId } });
  if (!installment) throw new Error('Parcela não encontrada');

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: INSTALLMENT_STATUS.PENDENTE, paidDate: null },
  });

  await syncFeeStatusFromInstallments(installment.feeId);

  return prisma.installment.findUnique({
    where: { id: installmentId },
    include: { fee: { include: { case: { include: { client: true } } } } },
  });
}

export interface CashFlowMonth {
  period: string; // YYYY-MM
  label: string;
  entradas: number;
  saidas: number;
  repasses: number;
  resultado: number;
  acumulado: number;
}

/**
 * Fluxo de caixa mensal.
 *
 * Entradas saem das parcelas pagas (e dos honorários sem parcela que já
 * foram pagos), saídas das despesas pagas e os repasses a sócios. O resultado
 * líquido é após os repasses, que é o valor que sobra no caixa do escritório.
 */
export async function getCashFlow(months: number): Promise<CashFlowMonth[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [installments, legacyPaidFees, expenses, repasses] = await Promise.all([
    prisma.installment.findMany({
      where: { status: INSTALLMENT_STATUS.PAGO, paidDate: { gte: start } },
      select: { amount: true, paidDate: true },
    }),
    prisma.fee.findMany({
      where: {
        status: FEE_STATUS.PAGO,
        installments: { none: {} },
        paidDate: { gte: start },
      },
      select: { amount: true, paidDate: true },
    }),
    prisma.expense.findMany({
      where: { status: 'PAGO', paidDate: { gte: start } },
      select: { amount: true, paidDate: true },
    }),
    prisma.repasse.findMany({
      where: { status: 'PAGO', referenceDate: { gte: start } },
      select: { amount: true, referenceDate: true },
    }),
  ]);

  const periodKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const buckets = new Map<string, { entradas: number; saidas: number; repasses: number }>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(periodKey(d), { entradas: 0, saidas: 0, repasses: 0 });
  }

  const add = (date: Date | null, amount: number, field: 'entradas' | 'saidas' | 'repasses') => {
    if (!date) return;
    const b = buckets.get(periodKey(date));
    if (b) b[field] += toCents(amount);
  };

  installments.forEach((i) => add(i.paidDate, i.amount, 'entradas'));
  legacyPaidFees.forEach((f) => add(f.paidDate, f.amount, 'entradas'));
  expenses.forEach((e) => add(e.paidDate, e.amount, 'saidas'));
  repasses.forEach((r) => add(r.referenceDate, r.amount, 'repasses'));

  const label = (d: Date) =>
    new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(d);

  const out: CashFlowMonth[] = [];
  let acumulado = 0;

  for (const [period, b] of buckets) {
    const entradas = toReais(b.entradas);
    const saidas = toReais(b.saidas);
    const rep = toReais(b.repasses);
    const resultado = toReais(b.entradas - b.saidas - b.repasses);
    acumulado = toReais(acumulado * 100 + (b.entradas - b.saidas - b.repasses));

    const [y, m] = period.split('-');
    out.push({
      period,
      label: label(new Date(Number(y), Number(m) - 1, 1)).replace('.', ''),
      entradas,
      saidas,
      repasses: rep,
      resultado,
      acumulado,
    });
  }

  return out;
}

/** Valor total já recebido, somando parcelas e honorários avulsos pagos. */
export async function getReceivedTotal(): Promise<number> {
  const [installments, fees] = await Promise.all([
    prisma.installment.aggregate({
      where: { status: INSTALLMENT_STATUS.PAGO },
      _sum: { amount: true },
    }),
    prisma.fee.aggregate({
      where: { status: FEE_STATUS.PAGO, installments: { none: {} } },
      _sum: { amount: true },
    }),
  ]);

  return toReais(toCents(installments._sum.amount ?? 0) + toCents(fees._sum.amount ?? 0));
}

/** Valor total ainda a receber (parcelas em aberto + honorários avulsos). */
export async function getReceivableTotal(): Promise<number> {
  const [installments, fees] = await Promise.all([
    prisma.installment.aggregate({
      where: { status: { in: [INSTALLMENT_STATUS.PENDENTE, INSTALLMENT_STATUS.ATRASADO] } },
      _sum: { amount: true },
    }),
    prisma.fee.aggregate({
      where: {
        status: { in: [FEE_STATUS.PENDENTE, FEE_STATUS.ATRASADO, FEE_STATUS.PARCELADO] },
        installments: { none: {} },
      },
      _sum: { amount: true },
    }),
  ]);

  return toReais(toCents(installments._sum.amount ?? 0) + toCents(fees._sum.amount ?? 0));
}

export interface Aging {
  aVencer: number;
  ate30: number;
  de31a60: number;
  de61a90: number;
  acima90: number;
}

export interface FinancialOverview {
  /** Total contratado em honorários (soma dos contratos, não das parcelas) */
  billed: number;
  /** Já recebido: parcelas pagas + honorários avulsos pagos */
  received: number;
  /** Ainda a receber: parcelas abertas + honorários avulsos abertos */
  receivable: number;
  overdueAmount: number;
  overdueCount: number;
  receivedThisMonth: number;
  collectionRate: number;
  /** Quantidade de unidades de cobrança: parcelas + honorários sem plano */
  openCount: number;
  paidCount: number;
  aging: Aging;
  expensesPaid: number;
  expensesPending: number;
  repassesPaid: number;
  repassesPending: number;
  /** Margem do mês: recebido menos despesas pagas menos repasses */
  netThisMonth: number;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysLate = (due: Date, today: Date) =>
  Math.floor((startOfDay(today).getTime() - startOfDay(due).getTime()) / 86400000);

/**
 * Visão financeira consolidada e sem duplicidade.
 *
 * O ponto delicado é não contar o mesmo dinheiro duas vezes: um honorário
 * parcelado aparece tanto em `fees` quanto em `installments`. Por isso as
 * consultas de honorários sempre filtram `installments: { none: {} }` — o que
 * sobra é o honorário cobrado em uma única parcela, tratado como avulso.
 * O "billed" é a exceção: ele mede o contratado, então soma todos os
 * honorários sem filtrar.
 */
export async function getFinancialOverview(): Promise<FinancialOverview> {
  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [billedAgg, installments, standaloneFees, expenses, repasses] = await Promise.all([
    prisma.fee.aggregate({ _sum: { amount: true } }),
    prisma.installment.findMany({
      select: { amount: true, status: true, dueDate: true, paidDate: true },
    }),
    prisma.fee.findMany({
      where: { installments: { none: {} } },
      select: { amount: true, status: true, dueDate: true, paidDate: true },
    }),
    prisma.expense.findMany({
      select: { amount: true, status: true, paidDate: true },
    }),
    prisma.repasse.findMany({
      select: { amount: true, status: true, referenceDate: true },
    }),
  ]);

  const billed = toCents(billedAgg._sum.amount ?? 0);

  let received = 0;
  let receivable = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let receivedThisMonth = 0;
  let paidCount = 0;
  let openCount = 0;

  const aging: Aging = { aVencer: 0, ate30: 0, de31a60: 0, de61a90: 0, acima90: 0 };

  /** Registra uma unidade de cobrança (parcela ou honorário avulso). */
  const register = (unit: { amount: number; status: string; dueDate: Date; paidDate: Date | null }) => {
    const cents = toCents(unit.amount);

    if (unit.status === INSTALLMENT_STATUS.PAGO) {
      received += cents;
      paidCount += 1;
      if (unit.paidDate && unit.paidDate >= monthStart) receivedThisMonth += cents;
      return;
    }

    receivable += cents;
    openCount += 1;

    const late = daysLate(unit.dueDate, today);
    if (late <= 0) {
      aging.aVencer += cents;
      return;
    }

    overdueAmount += cents;
    overdueCount += 1;

    if (late <= 30) aging.ate30 += cents;
    else if (late <= 60) aging.de31a60 += cents;
    else if (late <= 90) aging.de61a90 += cents;
    else aging.acima90 += cents;
  };

  installments.forEach(register);
  // Honorário sem plano conta como pago apenas se o status for PAGO; o
  // PARCELADO nunca chega aqui, pois por definição tem parcelas.
  standaloneFees.forEach((f) =>
    register({
      amount: f.amount,
      status: f.status === FEE_STATUS.PAGO ? INSTALLMENT_STATUS.PAGO : INSTALLMENT_STATUS.PENDENTE,
      dueDate: f.dueDate,
      paidDate: f.paidDate,
    })
  );

  let expensesPaid = 0;
  let expensesPending = 0;
  expenses.forEach((e) => {
    if (e.status === 'PAGO') {
      expensesPaid += toCents(e.amount);
    } else {
      expensesPending += toCents(e.amount);
    }
  });

  let repassesPaid = 0;
  let repassesPending = 0;
  repasses.forEach((r) => {
    if (r.status === 'PAGO') repassesPaid += toCents(r.amount);
    else repassesPending += toCents(r.amount);
  });

  // Despesas e repasses são deduzidos pelo mês corrente: é o que o caixa
  // do período efetivamente suportou. O repasse usa referenceDate porque
  // Repasse não tem paidDate — a própria data de referência é o marco.
  const expensesPaidThisMonth = toCents(
    expenses
      .filter((e) => e.status === 'PAGO' && e.paidDate && e.paidDate >= monthStart)
      .reduce((acc, e) => acc + e.amount, 0)
  );
  const repassesPaidThisMonth = toCents(
    repasses
      .filter((r) => r.status === 'PAGO' && r.referenceDate >= monthStart)
      .reduce((acc, r) => acc + r.amount, 0)
  );

  return {
    billed: toReais(billed),
    received: toReais(received),
    receivable: toReais(receivable),
    overdueAmount: toReais(overdueAmount),
    overdueCount,
    receivedThisMonth: toReais(receivedThisMonth),
    collectionRate: billed > 0 ? (received / toReais(billed)) * 100 : 0,
    openCount,
    paidCount,
    aging: {
      aVencer: toReais(aging.aVencer),
      ate30: toReais(aging.ate30),
      de31a60: toReais(aging.de31a60),
      de61a90: toReais(aging.de61a90),
      acima90: toReais(aging.acima90),
    },
    expensesPaid: toReais(expensesPaid),
    expensesPending: toReais(expensesPending),
    repassesPaid: toReais(repassesPaid),
    repassesPending: toReais(repassesPending),
    netThisMonth: toReais(receivedThisMonth - expensesPaidThisMonth - repassesPaidThisMonth),
  };
}