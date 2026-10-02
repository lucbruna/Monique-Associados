import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { EXPENSE_CATEGORIES } from '../services/finance.service';

const INCLUDE_CASE = {
  case: { include: { client: true } },
} as const;

/** Marca despesas vencidas e ainda abertas como ATRASADO. */
export const refreshOverdueExpenses = async (): Promise<number> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await prisma.expense.updateMany({
    where: { status: 'PENDENTE', dueDate: { lt: today } },
    data: { status: 'ATRASADO' },
  });

  return count;
};

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, caseId, from, to, search, limit, page } = req.query;

    await refreshOverdueExpenses();

    const where: any = {};
    if (status) where.status = status as string;
    if (category) where.category = category as string;
    if (caseId) where.caseId = caseId as string;
    if (from || to) {
      where.dueDate = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }
    if (search) {
      const term = (search as string).trim();
      where.OR = [
        { description: { contains: term } },
        { supplier: { contains: term } },
        { documentNumber: { contains: term } },
        { notes: { contains: term } },
      ];
    }

    const take = Math.min(parseInt((limit as string) || '50', 10) || 50, 200);
    const currentPage = Math.max(parseInt((page as string) || '1', 10) || 1, 1);

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: INCLUDE_CASE,
        orderBy: { dueDate: 'desc' },
        take,
        skip: (currentPage - 1) * take,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: expenses,
      meta: { total, page: currentPage, limit: take, pages: Math.ceil(total / take) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: INCLUDE_CASE,
    });

    if (!expense) {
      throw new AppError('Despesa não encontrada', 404);
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { description, category, amount, dueDate, paidDate, supplier, documentNumber, notes, caseId } =
      req.body;

    if (!description || !category || amount === undefined || !dueDate) {
      throw new AppError('Campos obrigatórios: description, category, amount, dueDate', 400);
    }

    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new AppError('O valor da despesa deve ser maior que zero', 400);
    }

    if (!EXPENSE_CATEGORIES.includes(category)) {
      throw new AppError(`Categoria inválida. Use: ${EXPENSE_CATEGORIES.join(', ')}`, 400);
    }

    // caseId é opcional: despesa de escritório não pertence a um processo.
    if (caseId) {
      const caseExists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } });
      if (!caseExists) {
        throw new AppError('Processo não encontrado', 404);
      }
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        category,
        amount: parsedAmount,
        dueDate: new Date(dueDate),
        paidDate: paidDate ? new Date(paidDate) : undefined,
        supplier: supplier || undefined,
        documentNumber: documentNumber || undefined,
        notes: notes || undefined,
        caseId: caseId || null,
      },
      include: INCLUDE_CASE,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { description, category, amount, dueDate, paidDate, status, supplier, documentNumber, notes, caseId } =
      req.body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new AppError('Despesa não encontrada', 404);
    }

    if (category !== undefined && !EXPENSE_CATEGORIES.includes(category)) {
      throw new AppError(`Categoria inválida. Use: ${EXPENSE_CATEGORIES.join(', ')}`, 400);
    }

    const data: any = {};
    if (description !== undefined) data.description = description;
    if (category !== undefined) data.category = category;
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (supplier !== undefined) data.supplier = supplier;
    if (documentNumber !== undefined) data.documentNumber = documentNumber;
    if (notes !== undefined) data.notes = notes;
    if (caseId !== undefined) data.caseId = caseId || null;
    if (paidDate !== undefined) data.paidDate = paidDate ? new Date(paidDate) : null;

    // Mesma coerência do honorário: a data de pagamento segue o status.
    if (status !== undefined) {
      data.status = status;
      if (status === 'PAGO') {
        if (paidDate === undefined && !expense.paidDate) data.paidDate = new Date();
      } else if (expense.status === 'PAGO') {
        data.paidDate = null;
      }
    }

    const updated = await prisma.expense.update({ where: { id }, data, include: INCLUDE_CASE });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) {
      throw new AppError('Despesa não encontrada', 404);
    }

    await prisma.expense.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Despesa excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};

/** Totais consolidados por categoria, para o gráfico de composição. */
export const getExpenseSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, status } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (from || to) {
      where.dueDate = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }

    const grouped = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const totals = grouped.reduce(
      (acc, g) => ({
        total: acc.total + (g._sum.amount ?? 0),
        count: acc.count + g._count._all,
      }),
      { total: 0, count: 0 }
    );

    res.json({
      success: true,
      data: grouped.map((g) => ({
        category: g.category,
        amount: g._sum.amount ?? 0,
        count: g._count._all,
        percent: totals.total > 0 ? ((g._sum.amount ?? 0) / totals.total) * 100 : 0,
      })),
      meta: totals,
    });
  } catch (error) {
    next(error);
  }
};

export const expenseCategories = (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: EXPENSE_CATEGORIES });
};