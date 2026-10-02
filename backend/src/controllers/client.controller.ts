import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { getClientFilter, canDeleteAny } from '../utils/permissions';

export const getClients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', search = '', isActive } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = getClientFilter(req.user!.role, req.user!.id);
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { cpfCnpj: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { cases: true, contracts: true }
          }
        }
      }),
      prisma.client.count({ where })
    ]);

    res.json({
      status: 'success',
      data: {
        clients,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        cases: {
          include: {
            responsible: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        contracts: true
      }
    });

    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    res.json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, cpfCnpj, type, address, city, state, zipCode, notes } = req.body;

    // Verificar se CPF/CNPJ já existe
    const existing = await prisma.client.findUnique({ where: { cpfCnpj } });
    if (existing) {
      throw new AppError('CPF/CNPJ já cadastrado', 400);
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        cpfCnpj,
        type,
        address,
        city,
        state,
        zipCode,
        notes
      }
    });

    await createAuditLog('CREATE', 'Client', client.id, req.user!.id, req.ip, req.get('user-agent'));

    res.status(201).json({
      status: 'success',
      message: 'Cliente criado com sucesso',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cpfCnpj, type, address, city, state, zipCode, notes, isActive } = req.body;

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      throw new AppError('Cliente não encontrado', 404);
    }

    // Se CPF/CNPJ mudou, verificar se não existe outro cliente com esse CPF/CNPJ
    if (cpfCnpj && cpfCnpj !== existingClient.cpfCnpj) {
      const duplicate = await prisma.client.findUnique({ where: { cpfCnpj } });
      if (duplicate) {
        throw new AppError('CPF/CNPJ já cadastrado', 400);
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        cpfCnpj,
        type,
        address,
        city,
        state,
        zipCode,
        notes,
        isActive
      }
    });

    await createAuditLog('UPDATE', 'Client', client.id, req.user!.id, req.ip, req.get('user-agent'));

    res.json({
      status: 'success',
      message: 'Cliente atualizado com sucesso',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { _count: { select: { cases: true } } }
    });

    if (!client) {
      throw new AppError('Cliente não encontrado', 404);
    }

    const caseCount = client._count.cases;

    // Exclusão simples: permitida a quem não tem processos vinculados
    if (caseCount === 0) {
      await prisma.client.delete({ where: { id } });
      await createAuditLog('DELETE', 'Client', id, req.user!.id, req.ip, req.get('user-agent'));

      return res.json({
        status: 'success',
        message: 'Cliente excluído com sucesso',
        data: { removedCases: 0, cascaded: false }
      });
    }

    // Cliente com processos vinculados: só o SUPER_ADMIN pode excluir em cascata
    if (!canDeleteAny(req.user!.role)) {
      throw new AppError(
        'Não é possível excluir cliente com processos associados. Somente o SUPER_ADMIN pode excluir em cascata.',
        400
      );
    }

    // Cascata explícita em transação.
    // O schema usa Case.client onDelete: Restrict, então os processos e os
    // registros dependentes precisam ser removidos antes do cliente.
    const removed = await prisma.$transaction(async (tx) => {
      const cases = await tx.case.findMany({
        where: { clientId: id },
        select: { id: true }
      });
      const caseIds = cases.map((c) => c.id);

      const counts = { cases: caseIds.length, contracts: 0 };
      let dependents = 0;

      if (caseIds.length > 0) {
        const inCases = { caseId: { in: caseIds } };

        const [parties, deadlines, hearings, documents, fees, notes, appointments] =
          await Promise.all([
            tx.party.deleteMany({ where: inCases }),
            tx.deadline.deleteMany({ where: inCases }),
            tx.hearing.deleteMany({ where: inCases }),
            tx.document.deleteMany({ where: inCases }),
            tx.fee.deleteMany({ where: inCases }),
            tx.note.deleteMany({ where: inCases }),
            tx.appointment.deleteMany({ where: inCases }),
          ]);

        dependents =
          parties.count +
          deadlines.count +
          hearings.count +
          documents.count +
          fees.count +
          notes.count +
          appointments.count;

        await tx.case.deleteMany({ where: { clientId: id } });
      }

      const contracts = await tx.contract.deleteMany({ where: { clientId: id } });
      counts.contracts = contracts.count;

      await tx.client.delete({ where: { id } });

      return { ...counts, dependents };
    });

    await createAuditLog(
      'DELETE',
      'Client',
      id,
      req.user!.id,
      req.ip,
      req.get('user-agent'),
      JSON.stringify({
        cascaded: true,
        removedCases: removed.cases,
        removedContracts: removed.contracts,
        removedDependents: removed.dependents,
        clientName: client.name
      })
    );

    const extras: string[] = [];
    if (removed.cases > 0) {
      extras.push(
        `${removed.cases} processo${removed.cases === 1 ? '' : 's'} e ${removed.dependents} registro${removed.dependents === 1 ? '' : 's'} vinculado${removed.dependents === 1 ? '' : 's'}`
      );
    }
    if (removed.contracts > 0) {
      extras.push(`${removed.contracts} contrato${removed.contracts === 1 ? '' : 's'}`);
    }

    res.json({
      status: 'success',
      message: extras.length
        ? `Cliente excluído com sucesso. Também foram excluídos: ${extras.join(', ')}.`
        : 'Cliente excluído com sucesso',
      data: {
        removedCases: removed.cases,
        removedContracts: removed.contracts,
        removedDependents: removed.dependents,
        cascaded: removed.cases > 0 || removed.contracts > 0
      }
    });
  } catch (error) {
    next(error);
  }
};
