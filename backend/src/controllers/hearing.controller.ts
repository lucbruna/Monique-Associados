import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

// List hearings (optional caseId filter)
export const getHearings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { caseId, status } = req.query;

    const where: any = {};
    if (caseId) where.caseId = caseId as string;
    if (status) where.status = status as string;

    const hearings = await prisma.hearing.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ status: 'success', data: hearings });
  } catch (error) {
    next(error);
  }
};

// Get hearing by ID
export const getHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hearing = await prisma.hearing.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
    });

    if (!hearing) {
      throw new AppError('Audiência não encontrada', 404);
    }

    res.json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

// Create hearing
export const createHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, date, location, type, status, notes, caseId } = req.body;

    if (!title || !date || !type || !caseId) {
      throw new AppError('Campos obrigatórios: title, date, type, caseId', 400);
    }

    const hearing = await prisma.hearing.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        type,
        status: status || 'AGENDADA',
        notes,
        caseId,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
    });

    await createAuditLog(
      'CREATE',
      'Hearing',
      hearing.id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Audiência ${title} criada`
    );

    res.status(201).json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

// Update hearing
export const updateHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, type, status, notes } = req.body;

    const existingHearing = await prisma.hearing.findUnique({ where: { id } });
    if (!existingHearing) {
      throw new AppError('Audiência não encontrada', 404);
    }

    const hearing = await prisma.hearing.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        date: date ? new Date(date) : undefined,
        location: location !== undefined ? location : undefined,
        type: type !== undefined ? type : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
    });

    await createAuditLog(
      'UPDATE',
      'Hearing',
      id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Audiência ${hearing.title} atualizada`
    );

    res.json({ status: 'success', data: hearing });
  } catch (error) {
    next(error);
  }
};

// Delete hearing
export const deleteHearing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const hearing = await prisma.hearing.findUnique({ where: { id } });
    if (!hearing) {
      throw new AppError('Audiência não encontrada', 404);
    }

    await prisma.hearing.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Hearing',
      id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      `Audiência ${hearing.title} excluída`
    );

    res.json({ status: 'success', message: 'Audiência excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};
