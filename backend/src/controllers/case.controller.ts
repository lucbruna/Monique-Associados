import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { getCaseFilter, canCreateCase, canDeleteCase } from '../utils/permissions';

export const getCases = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', status, type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = getCaseFilter(req.user!.role, req.user!.id);
    if (status) where.status = status;
    if (type) where.type = type;

    const [cases, total] = await Promise.all([
      prisma.case.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' }, include: { client: true, responsible: { select: { id: true, name: true } } } }),
      prisma.case.count({ where })
    ]);

    res.json({ status: 'success', data: { cases, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } } });
  } catch (error) {
    next(error);
  }
};

export const getCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const caseData = await prisma.case.findUnique({ where: { id: req.params.id }, include: { client: true, responsible: true, parties: true, deadlines: true, hearings: true, documents: true, notes: { include: { author: { select: { id: true, name: true } } } }, fees: true } });
    if (!caseData) throw new AppError('Processo não encontrado', 404);
    res.json({ status: 'success', data: { case: caseData } });
  } catch (error) {
    next(error);
  }
};

/**
 * Gera um número sequencial no formato ANO-0001.
 *
 * A unicidade é do banco (caseNumber é @unique); se duas requisições gerarem o
 * mesmo número ao mesmo tempo, o chamador repete e o índice resolve o conflito.
 */
const generateCaseNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const total = await prisma.case.count({
    where: { caseNumber: { startsWith: `${year}-` } },
  });

  return `${year}-${String(total + 1).padStart(4, '0')}`;
};

const CASE_TYPES = [
  'TRABALHISTA',
  'CIVIL',
  'CRIMINAL',
  'TRIBUTARIO',
  'FAMILIA',
  'PREVIDENCIARIO',
  'CONSUMIDOR',
  'EMPRESARIAL',
  'AMBIENTAL',
  'OUTROS',
];

const CASE_STATUSES = ['ATIVO', 'ENCERRADO', 'SUSPENSO', 'ARQUIVADO', 'TRANSFERIDO'];

export const createCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!canCreateCase(req.user!.role)) {
      throw new AppError('Você não tem permissão para criar processos', 403);
    }

    const {
      caseNumber,
      title,
      clientId,
      type,
      status = 'ATIVO',
      description,
      court,
      jurisdiction,
      judge,
      value,
      startDate,
      responsibleId,
    } = req.body;

    if (!title?.trim()) {
      throw new AppError('O título do processo é obrigatório', 400);
    }
    if (!clientId) {
      throw new AppError('Selecione o cliente do processo', 400);
    }
    if (!type || !CASE_TYPES.includes(type)) {
      throw new AppError(`Tipo de processo inválido. Use: ${CASE_TYPES.join(', ')}`, 400);
    }
    if (!CASE_STATUSES.includes(status)) {
      throw new AppError(`Status inválido. Use: ${CASE_STATUSES.join(', ')}`, 400);
    }

    // O cliente precisa existir: sem esta checagem o erro do Prisma vira 500
    // genérico em vez de uma mensagem que o usuário entenda.
    const clientExists = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!clientExists) {
      throw new AppError('Cliente não encontrado', 400);
    }

    let owner = responsibleId || req.user!.id;
    const ownerExists = await prisma.user.findUnique({ where: { id: owner }, select: { id: true } });
    if (!ownerExists) owner = req.user!.id;

    // Campo explicitamente enviado como vazio conta como não informado, para
    // que um formulário em branco não tente gravar "null" em campo obrigatório.
    const number = caseNumber?.trim() || (await generateCaseNumber());

    const existing = await prisma.case.findUnique({ where: { caseNumber: number }, select: { id: true } });
    if (existing) {
      throw new AppError(`Já existe um processo com o número ${number}`, 409);
    }

    const caseData = await prisma.case.create({
      data: {
        caseNumber: number,
        title: title.trim(),
        clientId,
        responsibleId: owner,
        type,
        status,
        description: description?.trim() || undefined,
        court: court?.trim() || undefined,
        jurisdiction: jurisdiction?.trim() || undefined,
        judge: judge?.trim() || undefined,
        value: value === undefined || value === null || value === '' ? undefined : Number(value),
        startDate: startDate ? new Date(startDate) : undefined,
      },
    });

    res.status(201).json({ status: 'success', message: 'Processo criado com sucesso', data: { case: caseData } });
  } catch (error) {
    next(error);
  }
};

export const updateCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const caseData = await prisma.case.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', message: 'Processo atualizado com sucesso', data: { case: caseData } });
  } catch (error) {
    next(error);
  }
};

export const deleteCase = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!canDeleteCase(req.user!.role)) {
      throw new AppError('Você não tem permissão para excluir processos', 403);
    }
    await prisma.case.delete({ where: { id: req.params.id } });
    res.json({ status: 'success', message: 'Processo excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};
