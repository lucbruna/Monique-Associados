import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import {
  getFinancialOverview,
  refreshOverdueInstallments,
} from '../services/finance.service';

// Get dashboard stats
export const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [
      totalClients,
      totalCases,
      activeCases,
      pendingDeadlines,
      upcomingHearings,
      totalFees,
      paidFees,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.case.count(),
      prisma.case.count({ where: { status: 'ATIVO' } }),
      prisma.deadline.count({ where: { isCompleted: false } }),
      prisma.hearing.count({
        where: {
          date: {
            gte: new Date(),
          },
        },
      }),
      prisma.fee.aggregate({
        _sum: {
          amount: true,
        },
      }),
      prisma.fee.aggregate({
        where: { status: 'PAGO' },
        _sum: {
          amount: true,
        },
      }),
    ]);

    const pendingFeesAmount = await prisma.fee.aggregate({
      where: { status: { in: ['PENDENTE', 'ATRASADO'] } },
      _sum: {
        amount: true,
      },
    });

    const totalDocuments = await prisma.document.count();

    const stats = {
      totalClients,
      totalCases,
      activeCases,
      pendingDeadlines,
      upcomingHearings,
      pendingFees: pendingFeesAmount._sum.amount || 0,
      totalDocuments,
      totalRevenue: totalFees._sum.amount || 0,
      paidRevenue: paidFees._sum.amount || 0,
    };

    res.json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
};

// Get case type distribution
export const getCaseTypeDistribution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const casesByType = await prisma.case.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
    });

    const distribution = casesByType.map((item) => ({
      type: item.type,
      count: item._count._all,
    }));

    res.json({ status: 'success', data: distribution });
  } catch (error) {
    next(error);
  }
};

// Get monthly activity
export const getMonthlyActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const [casesData, hearingsData] = await Promise.all([
      prisma.case.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
      }),
      prisma.hearing.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          date: true,
        },
      }),
    ]);

    const monthlyCaseCounts = Array(12).fill(0);
    const monthlyHearingCounts = Array(12).fill(0);
    
    casesData.forEach((c) => {
      const month = c.createdAt.getMonth();
      monthlyCaseCounts[month]++;
    });

    hearingsData.forEach((h) => {
      const month = h.date.getMonth();
      monthlyHearingCounts[month]++;
    });

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map((month, index) => ({
      month,
      cases: monthlyCaseCounts[index],
      hearings: monthlyHearingCounts[index],
    }));

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers compartilhados pelos novos KPIs
// ─────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

const monthKey = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────
// Resumo financeiro: lançado, recebido, a receber e aging
// ─────────────────────────────────────────────────────────────

export const getFinancialSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Delega ao serviço financeiro, que é ciente de parcelas. Somar `fees`
    // direto aqui contaria o mesmo honorário duas vezes depois que ele passa
    // a ter um plano de parcelas.
    await refreshOverdueInstallments();
    const overview = await getFinancialOverview();

    res.json({
      status: 'success',
      data: {
        billed: overview.billed,
        received: overview.received,
        receivable: overview.receivable,
        overdueAmount: overview.overdueAmount,
        overdueCount: overview.overdueCount,
        receivedThisMonth: overview.receivedThisMonth,
        collectionRate: overview.collectionRate,
        totalFees: overview.paidCount + overview.openCount,
        paidCount: overview.paidCount,
        aging: overview.aging,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Tendência: lançado x recebido nos últimos 12 meses
// ─────────────────────────────────────────────────────────────

export const getRevenueTrend = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const fees = await prisma.fee.findMany({
      where: {
        OR: [{ createdAt: { gte: windowStart } }, { paidDate: { gte: windowStart } }],
      },
      select: { amount: true, createdAt: true, paidDate: true, status: true },
    });

    // 12 chaves de mês, da mais antiga para a mais recente
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }

    const billedByMonth: Record<string, number> = {};
    const receivedByMonth: Record<string, number> = {};
    keys.forEach((k) => {
      billedByMonth[k] = 0;
      receivedByMonth[k] = 0;
    });

    fees.forEach((f) => {
      const billedKey = monthKey(f.createdAt);
      if (billedKey in billedByMonth) {
        billedByMonth[billedKey] += f.amount;
      }
      if (f.status === 'PAGO' && f.paidDate) {
        const paidKey = monthKey(f.paidDate);
        if (paidKey in receivedByMonth) {
          receivedByMonth[paidKey] += f.amount;
        }
      }
    });

    const labels = keys.map((k) => {
      const [y, m] = k.split('-');
      return `${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][Number(m) - 1]}/${y.slice(2)}`;
    });

    const data = keys.map((k, i) => ({
      month: labels[i],
      billed: billedByMonth[k],
      received: receivedByMonth[k],
    }));

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Carga de trabalho por advogado
// ─────────────────────────────────────────────────────────────

export const getWorkload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const [users, casesByOwner] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, oab: true, role: true },
      }),
      prisma.case.groupBy({
        by: ['responsibleId'],
        where: { status: 'ATIVO' },
        _count: { _all: true },
      }),
    ]);

    // Prazos não têm responsávelId; derivamos via case.responsibleId
    const deadlines = await prisma.deadline.findMany({
      where: { isCompleted: false, caseId: { not: null } },
      select: { dueDate: true, case: { select: { responsibleId: true } } },
    });

    const activeByOwner: Record<string, number> = {};
    casesByOwner.forEach((c) => {
      activeByOwner[c.responsibleId] = c._count._all;
    });

    const openDeadlinesByOwner: Record<string, number> = {};
    const overdueDeadlinesByOwner: Record<string, number> = {};
    deadlines.forEach((d) => {
      const owner = d.case?.responsibleId;
      if (!owner) return;
      openDeadlinesByOwner[owner] = (openDeadlinesByOwner[owner] || 0) + 1;
      if (new Date(d.dueDate) < now) {
        overdueDeadlinesByOwner[owner] = (overdueDeadlinesByOwner[owner] || 0) + 1;
      }
    });

    const data = users
      .map((u) => ({
        id: u.id,
        name: u.name,
        oab: u.oab,
        role: u.role,
        activeCases: activeByOwner[u.id] || 0,
        openDeadlines: openDeadlinesByOwner[u.id] || 0,
        overdueDeadlines: overdueDeadlinesByOwner[u.id] || 0,
      }))
      .sort((a, b) => b.activeCases - a.activeCases);

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Saúde dos prazos: atrasados, hoje, 3 dias, 7 dias
// ─────────────────────────────────────────────────────────────

export const getDeadlineHealth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const today = startOfDay(new Date());
    const in3 = addDays(today, 3);
    const in7 = addDays(today, 7);

    const [overdue, dueToday, next3, next7, later, total, completed] = await Promise.all([
      prisma.deadline.count({ where: { isCompleted: false, dueDate: { lt: today } } }),
      prisma.deadline.count({ where: { isCompleted: false, dueDate: today } }),
      prisma.deadline.count({
        where: { isCompleted: false, dueDate: { gt: today, lte: in3 } },
      }),
      prisma.deadline.count({
        where: { isCompleted: false, dueDate: { gt: in3, lte: in7 } },
      }),
      prisma.deadline.count({
        where: { isCompleted: false, dueDate: { gt: in7 } },
      }),
      prisma.deadline.count(),
      prisma.deadline.count({ where: { isCompleted: true } }),
    ]);

    const open = overdue + dueToday + next3 + next7 + later;
    const complianceRate = total > 0 ? (completed / total) * 100 : 0;

    res.json({
      status: 'success',
      data: { overdue, dueToday, next3, next7, later, open, total, completed, complianceRate },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Distribuição de processos por status
// ─────────────────────────────────────────────────────────────

export const getCaseStatusDistribution = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const grouped = await prisma.case.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const data = grouped
      .map((g) => ({ status: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count);

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
