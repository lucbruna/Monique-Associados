import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  expenseCategories,
} from '../controllers/expense.controller';

const router = Router();
router.use(authenticate);

// Despesas do escritório são restritas a quem responde pelo financeiro.
// Um advogado acompanha custos dos próprios processos, mas não o caixa geral.
const EXPENSE_MANAGE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.SOCIO,
  ROLES.FINANCEIRO,
  ROLES.DIRETOR,
  ROLES.GERENTE,
  ROLES.CONTADOR,
];

router.get('/categories', expenseCategories);
router.get('/summary', getExpenseSummary);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', authorize(...EXPENSE_MANAGE_ROLES), createExpense);
router.put('/:id', authorize(...EXPENSE_MANAGE_ROLES), updateExpense);
router.delete('/:id', authorize(...EXPENSE_MANAGE_ROLES), deleteExpense);

export default router;