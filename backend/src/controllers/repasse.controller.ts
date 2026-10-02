import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/** Normaliza o período "YYYY-MM" para o mês completo. */
function periodRange(period?: string): { gte?: Date; lte?: Date } | undefined {
  if (!period) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return undefined;

  return {
    gte: new Date(year, month - 1, 1),
    lte: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export const getRepasses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, period, partnerName, from, to, search, limit, page } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (period) where.period = period as string;
    if (partnerName) where.partnerName = { contains: partnerName as string };
    if (from || to) {
      where.referenceDate = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }
    if (search) {
      const term = (search as string).trim();
      where.OR = [{ partnerName: { contains: term } }, { notes: { contains: term } }];
    }

    const take = Math.min(parseInt((limit as string) || '50', 10) || 50, 200);
    const currentPage = Math.max(parseInt((page as string) || '1', 10) || 1, 1);

    const [repasses, total] = await Promise.all([
      prisma.repasse.findMany({
        where,
        orderBy: { referenceDate: 'desc' },
        take,
        skip: (currentPage - 1) * take,
      }),
      prisma.repasse.count({ where }),
    ]);

    res.json({
      success: true,
      data: repasses,
      meta: { total, page: currentPage, limit: take, pages: Math.ceil(total / take) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const getRepasse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const repasse = await prisma.repasse.findUnique({ where: { id: req.params.id } });

    if (!repasse) {
      throw new AppError('Repasse não encontrado', 404);
    }

    res.json({ success: true, data: repasse });
  } catch (error) {
    next(error);
  }
};

export const createRepasse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { partnerName, amount, referenceDate, period, status, notes } = req.body;

    if (!partnerName || amount === undefined || !referenceDate) {
      throw new AppError('Campos obrigatórios: partnerName, amount, referenceDate', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new AppError('O valor do repasse deve ser maior que zero', 400);
    }

    const repasse = await prisma.repasse.create({
      data: {
        partnerName,
        amount: parsedAmount,
        referenceDate: new Date(referenceDate),
        // Sem período explícito, usa o mês da própria data de referência.
        period: period ?? new Date(referenceDate).toISOString().slice(0, 7),
        status: status || 'PENDENTE',
        notes: notes || undefined,
      },
    });

    res.status(201).json({ success: true, data: repasse });
  } catch (error) {
    next(error);
  }
};

export const updateRepasse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { partnerName, amount, referenceDate, period, status, notes } = req.body;

    const existing = await prisma.repasse.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Repasse não encontrado', 404);
    }

    const data: any = {};
    if (partnerName !== undefined) data.partnerName = partnerName;
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (referenceDate !== undefined) data.referenceDate = new Date(referenceDate);
    if (period !== undefined) data.period = period || null;
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;

    const updated = await prisma.repasse.update({ where: { id }, data });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteRepasse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.repasse.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError('Repasse não encontrado', 404);
    }

    await prisma.repasse.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Repasse excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Consolidado por sócio: quanto foi repassado e quanto ainda está pendente,
 * para conferência da comissão do período.
 */
export const getRepasseSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    const range = periodRange(period as string | undefined);

    const where: any = {};
    if (range) where.referenceDate = range;

    const grouped = await prisma.repasse.groupBy({
      by: ['partnerName'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const rows = await Promise.all(
      grouped.map(async (g) => {
        const [paid, pending] = await Promise.all([
          prisma.repasse.aggregate({
            where: { ...where, partnerName: g.partnerName, status: 'PAGO' },
            _sum: { amount: true },
          }),
          prisma.repasse.aggregate({
            where: { ...where, partnerName: g.partnerName, status: { not: 'PAGO' } },
            _sum: { amount: true },
          }),
        ]);

        return {
          partnerName: g.partnerName,
          total: g._sum.amount ?? 0,
          count: g._count._all,
          paid: paid._sum.amount ?? 0,
          pending: pending._sum.amount ?? 0,
        };
      })
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        period: period ?? null,
        total: rows.reduce((acc, r) => acc + r.total, 0),
        paid: rows.reduce((acc, r) => acc + r.paid, 0),
        pending: rows.reduce((acc, r) => acc + r.pending, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};