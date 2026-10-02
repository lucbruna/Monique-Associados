import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ status: 'success', data: appointments });
  } catch (error) {
    next(error);
  }
};

export const getAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          }
        }
      }
    });
    res.json({ status: 'success', data: appointment });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, type, startTime, endTime, location, participants, userId, caseId } = req.body;
    
    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        type,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        participants,
        userId: userId || req.user!.id,
        ...(caseId && { caseId })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          }
        }
      }
    });
    res.status(201).json({ status: 'success', data: appointment });
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, type, startTime, endTime, location, participants, caseId } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        title,
        description,
        type,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        location,
        participants,
        ...(caseId !== undefined && { caseId: caseId || null })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          }
        },
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true,
          }
        }
      }
    });
    res.json({ status: 'success', data: appointment });
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.appointment.delete({
      where: { id }
    });
    res.json({ status: 'success', message: 'Compromisso excluído' });
  } catch (error) {
    next(error);
  }
};
