import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// List templates (optional category filter)
export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category, isActive } = req.query;

    const where: any = {};
    if (category) where.category = category as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.template.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ status: 'success', data: templates });
  } catch (error) {
    next(error);
  }
};

// Get template by ID
export const getTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({ where: { id } });

    if (!template) {
      throw new AppError('Template não encontrado', 404);
    }

    res.json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, content, category, variables, isActive } = req.body;

    if (!name || !content || !category) {
      throw new AppError('Campos obrigatórios: name, content, category', 400);
    }

    const template = await prisma.template.create({
      data: {
        name,
        description,
        content,
        category,
        variables,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, content, category, variables, isActive } = req.body;

    const existingTemplate = await prisma.template.findUnique({ where: { id } });
    if (!existingTemplate) {
      throw new AppError('Template não encontrado', 404);
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        content: content !== undefined ? content : undefined,
        category: category !== undefined ? category : undefined,
        variables: variables !== undefined ? variables : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res.json({ status: 'success', data: template });
  } catch (error) {
    next(error);
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new AppError('Template não encontrado', 404);
    }

    await prisma.template.delete({ where: { id } });

    res.json({ status: 'success', message: 'Template excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};
