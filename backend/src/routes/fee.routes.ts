import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getFees,
  getFee,
  createFee,
  updateFee,
  deleteFee,
  getFeeStats,
} from '../controllers/fee.controller';

const router = Router();
router.use(authenticate);

// Roles allowed to manage fees: everyone who can view finance data
// (canViewFinance) plus lawyers, who bill honorários on their cases.
// Keep in sync with canViewFinance in utils/permissions.ts so the
// Sidebar never shows the page to a role the API rejects.
const FEE_MANAGE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.SOCIO,
  ROLES.ADVOGADO,
  ROLES.FINANCEIRO,
  ROLES.DIRETOR,
  ROLES.GERENTE,
  ROLES.CONTADOR,
];

router.get('/stats', getFeeStats);
router.get('/', getFees);
router.get('/:id', getFee);
router.post('/', authorize(...FEE_MANAGE_ROLES), createFee);
router.put('/:id', authorize(...FEE_MANAGE_ROLES), updateFee);
router.delete('/:id', authorize(...FEE_MANAGE_ROLES), deleteFee);

export default router;
