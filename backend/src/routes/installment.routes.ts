import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getInstallments,
  getInstallment,
  createPlan,
  updateInstallment,
  pay,
  reopen,
  remove,
  generateInstallmentPix,
} from '../controllers/installment.controller';

const router = Router();
router.use(authenticate);

// Quem enxerga o caixa também pode quitar parcelas e gerar cobranças.
// Mantém em sincronia com FEE_MANAGE_ROLES de fee.routes.ts.
const FINANCE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.SOCIO,
  ROLES.ADVOGADO,
  ROLES.FINANCEIRO,
  ROLES.DIRETOR,
  ROLES.GERENTE,
  ROLES.CONTADOR,
];

router.get('/', getInstallments);
router.get('/:id', getInstallment);

// O plano de parcelas é montado pelo honorário, não pela própria parcela.
router.post('/plan', authorize(...FINANCE_ROLES), createPlan);
router.put('/:id', authorize(...FINANCE_ROLES), updateInstallment);
router.post('/:id/pay', authorize(...FINANCE_ROLES), pay);
router.post('/:id/reopen', authorize(...FINANCE_ROLES), reopen);
router.post('/:id/pix', authorize(...FINANCE_ROLES), generateInstallmentPix);
router.delete('/:id', authorize(...FINANCE_ROLES), remove);

export default router;