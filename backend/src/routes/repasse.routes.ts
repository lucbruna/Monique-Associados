import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getRepasses,
  getRepasse,
  createRepasse,
  updateRepasse,
  deleteRepasse,
  getRepasseSummary,
} from '../controllers/repasse.controller';

const router = Router();
router.use(authenticate);

// Repasse distribui dinheiro entre os sócios: só a direção financeira
// autoriza. ADVOGADO fica de fora de propósito.
const REPASSE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.SOCIO,
  ROLES.FINANCEIRO,
  ROLES.DIRETOR,
  ROLES.CONTADOR,
];

router.get('/summary', getRepasseSummary);
router.get('/', getRepasses);
router.get('/:id', getRepasse);
router.post('/', authorize(...REPASSE_ROLES), createRepasse);
router.put('/:id', authorize(...REPASSE_ROLES), updateRepasse);
router.delete('/:id', authorize(...REPASSE_ROLES), deleteRepasse);

export default router;