import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getSummary,
  getCashFlowSeries,
  getSettings,
  updateSettings,
  getMeta,
} from '../controllers/finance.controller';

const router = Router();
router.use(authenticate);

// Todo o módulo é exclusivo de quem enxerga o caixa (canViewFinance).
const VIEW_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.SOCIO,
  ROLES.FINANCEIRO,
  ROLES.DIRETOR,
  ROLES.GERENTE,
  ROLES.CONTADOR,
];

// Alterar a chave PIX muda para onde o dinheiro cai — acesso restrito.
const SETTINGS_ROLES = [ROLES.SUPER_ADMIN, ROLES.SOCIO, ROLES.FINANCEIRO];

router.get('/meta', authorize(...VIEW_ROLES), getMeta);
router.get('/summary', authorize(...VIEW_ROLES), getSummary);
router.get('/cash-flow', authorize(...VIEW_ROLES), getCashFlowSeries);
router.get('/settings', authorize(...VIEW_ROLES), getSettings);
router.put('/settings', authorize(...SETTINGS_ROLES), updateSettings);

export default router;