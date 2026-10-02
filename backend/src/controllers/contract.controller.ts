import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

// List contracts (optional clientId filter)
export const getContracts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { clientId } = req.query;

    const where: any = {};
    if (clientId) where.clientId = clientId as string;

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ status: 'success', data: contracts });
  } catch (error) {
    next(error);
  }
};

// Get contract by ID
export const getContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
      },
    });

    if (!contract) {
      throw new AppError('Contrato não encontrado', 404);
    }

    res.json({ status: 'success', data: contract });
  } catch (error) {
    next(error);
  }
};

// Create contract
export const createContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, value, startDate, endDate, status, terms, clientId } = req.body;

    if (!title || !value || !startDate || !clientId) {
      throw new AppError('Campos obrigatórios: title, value, startDate, clientId', 400);
    }

    const contract = await prisma.contract.create({
      data: {
        title,
        description,
        value: parseFloat(value),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'ATIVO',
        terms,
        clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
      },
    });

    await createAuditLog(
      'CREATE',
      'Contract',
      contract.id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Contrato ${title} criado`
    );

    res.status(201).json({ status: 'success', data: contract });
  } catch (error) {
    next(error);
  }
};

// Update contract
export const updateContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, value, startDate, endDate, status, terms } = req.body;

    const existingContract = await prisma.contract.findUnique({ where: { id } });
    if (!existingContract) {
      throw new AppError('Contrato não encontrado', 404);
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        value: value !== undefined ? parseFloat(value) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        status: status !== undefined ? status : undefined,
        terms: terms !== undefined ? terms : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Contract',
      id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Contrato ${contract.title} atualizado`
    );

    res.json({ status: 'success', data: contract });
  } catch (error) {
    next(error);
  }
};

// Delete contract
export const deleteContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      throw new AppError('Contrato não encontrado', 404);
    }

    await prisma.contract.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Contract',
      id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Contrato ${contract.title} excluído`
    );

    res.json({ status: 'success', message: 'Contrato excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};
