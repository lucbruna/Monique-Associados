import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import { getContracts, getContract, createContract, updateContract, deleteContract } from '../controllers/contract.controller';

const router = Router();
router.use(authenticate);

router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.SUPER_ADMIN), createContract);
router.put('/:id', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.SUPER_ADMIN), updateContract);
router.delete('/:id', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.SUPER_ADMIN), deleteContract);

export default router;
