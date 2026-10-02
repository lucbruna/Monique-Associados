import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  generateInstallments,
  payInstallment,
  reopenInstallment,
  refreshOverdueInstallments,
  syncFeeStatusFromInstallments,
  INSTALLMENT_STATUS,
  PAYMENT_METHODS,
} from '../services/finance.service';
import { getPixConfig } from '../services/settings.service';
import { generatePix } from '../utils/pix';

/** Inclui o caminho do honorário até o cliente, usado em todas as respostas. */
const INCLUDE_FEE_PATH = {
  fee: {
    include: {
      case: { include: { client: true } },
    },
  },
} as const;

export const getInstallments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feeId, status, caseId, from, to, search, limit, page } = req.query;

    // Mantém o espelho com o honorário consistente antes de listar.
    await refreshOverdueInstallments();

    const where: any = {};
    if (feeId) where.feeId = feeId as string;
    if (status) where.status = status as string;
    if (caseId) where.fee = { caseId: caseId as string };
    if (from || to) {
      where.dueDate = {
        ...(from ? { gte: new Date(from as string) } : {}),
        ...(to ? { lte: new Date(to as string) } : {}),
      };
    }
    if (search) {
      const term = (search as string).trim();
      where.OR = [
        { reference: { contains: term } },
        { notes: { contains: term } },
        { fee: { description: { contains: term } } },
        { fee: { case: { client: { name: { contains: term } } } } },
      ];
    }

    const take = Math.min(parseInt((limit as string) || '50', 10) || 50, 200);
    const currentPage = Math.max(parseInt((page as string) || '1', 10) || 1, 1);

    const [installments, total] = await Promise.all([
      prisma.installment.findMany({
        where,
        include: INCLUDE_FEE_PATH,
        orderBy: [{ dueDate: 'asc' }, { number: 'asc' }],
        take,
        skip: (currentPage - 1) * take,
      }),
      prisma.installment.count({ where }),
    ]);

    res.json({
      success: true,
      data: installments,
      meta: { total, page: currentPage, limit: take, pages: Math.ceil(total / take) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

export const getInstallment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const installment = await prisma.installment.findUnique({
      where: { id: req.params.id },
      include: INCLUDE_FEE_PATH,
    });

    if (!installment) {
      throw new AppError('Parcela não encontrada', 404);
    }

    res.json({ success: true, data: installment });
  } catch (error) {
    next(error);
  }
};

/**
 * Gera (ou regenera) o plano de parcelas de um honorário.
 *
 * Regerar apaga as parcelas anteriores, então o endpoint recusa o pedido
 * se houver parcela já paga: nesse caso o caminho é reabrir a parcela
 * antes de recalcular o plano.
 */
export const createPlan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feeId, count, firstDueDate, interval = 1, unit = 'MONTHS', totalAmount } = req.body;

    if (!feeId || !count || !firstDueDate) {
      throw new AppError('Campos obrigatórios: feeId, count, firstDueDate', 400);
    }

    if (!['DAYS', 'MONTHS'].includes(unit)) {
      throw new AppError('unit deve ser DAYS ou MONTHS', 400);
    }

    const paidCount = await prisma.installment.count({
      where: { feeId, status: INSTALLMENT_STATUS.PAGO },
    });

    if (paidCount > 0) {
      throw new AppError(
        'Não é possível regerar o plano: há parcelas já pagas. Reabra a parcela ou mantenha o plano atual.',
        409
      );
    }

    const installments = await generateInstallments({
      feeId,
      count: Number(count),
      firstDueDate,
      interval: Number(interval) || 1,
      unit: unit as 'DAYS' | 'MONTHS',
      totalAmount: totalAmount !== undefined ? Number(totalAmount) : undefined,
    });

    await syncFeeStatusFromInstallments(feeId);

    const fee = await prisma.fee.findUnique({ where: { id: feeId } });

    res.status(201).json({
      success: true,
      data: installments,
      meta: {
        total: installments.reduce((acc, i) => acc + i.amount, 0),
        feeStatus: fee?.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInstallment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { dueDate, amount, notes, reference, method } = req.body;

    const installment = await prisma.installment.findUnique({ where: { id } });
    if (!installment) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (installment.status === INSTALLMENT_STATUS.PAGO && amount !== undefined) {
      throw new AppError('Não é possível alterar o valor de uma parcela já paga', 409);
    }

    const data: any = {};
    if (dueDate !== undefined) data.dueDate = new Date(dueDate);
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (notes !== undefined) data.notes = notes;
    if (reference !== undefined) data.reference = reference;
    if (method !== undefined) data.method = method;

    const updated = await prisma.installment.update({
      where: { id },
      data,
      include: INCLUDE_FEE_PATH,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const pay = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paidDate, method, reference, notes } = req.body;

    if (method && !PAYMENT_METHODS.includes(method as any)) {
      throw new AppError(`Forma de pagamento inválida. Use: ${PAYMENT_METHODS.join(', ')}`, 400);
    }

    const installment = await payInstallment(id, {
      paidDate: paidDate ? new Date(paidDate) : undefined,
      method,
      reference,
      notes,
    });

    res.json({ success: true, data: installment });
  } catch (error) {
    next(error);
  }
};

export const reopen = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const installment = await reopenInstallment(req.params.id);
    res.json({ success: true, data: installment });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const installment = await prisma.installment.findUnique({ where: { id: req.params.id } });
    if (!installment) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (installment.status === INSTALLMENT_STATUS.PAGO) {
      throw new AppError('Reabra a parcela antes de excluí-la', 409);
    }

    await prisma.installment.delete({ where: { id: req.params.id } });
    await syncFeeStatusFromInstallments(installment.feeId);

    res.json({ success: true, message: 'Parcela excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Gera o BR Code PIX de uma parcela e guarda o código na própria parcela.
 *
 * O txid recebe o número da parcela e um sufixo do honorário, o que permite
 * reconciliar o pagamento no extrato do banco sem depender de um PSP.
 */
export const generateInstallmentPix = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const installment = await prisma.installment.findUnique({
      where: { id },
      include: INCLUDE_FEE_PATH,
    });

    if (!installment) {
      throw new AppError('Parcela não encontrada', 404);
    }

    if (installment.status === INSTALLMENT_STATUS.PAGO) {
      throw new AppError('A parcela já está paga', 409);
    }

    const config = await getPixConfig();
    if (!config.configured) {
      throw new AppError(
        'Configure a chave PIX do escritório em Configurações antes de gerar cobranças.',
        409
      );
    }

    const txid = `${installment.feeId.slice(0, 8)}${String(installment.number).padStart(3, '0')}`.toUpperCase();

    const { payload, crc } = generatePix({
      pixKey: config.pixKey,
      amount: installment.amount,
      receiverName: config.receiverName,
      receiverCity: config.receiverCity,
      txid,
    });

    const updated = await prisma.installment.update({
      where: { id },
      data: { pixCode: payload, reference: txid },
      include: INCLUDE_FEE_PATH,
    });

    res.json({
      success: true,
      data: {
        ...updated,
        pix: { payload, crc, txid },
      },
    });
  } catch (error) {
    next(error);
  }
};