import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ROLES } from '../utils/permissions';
import {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
} from '../controllers/client.controller';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.ADMINISTRATIVO, ROLES.SUPER_ADMIN), createClient);
router.put('/:id', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.ADMINISTRATIVO, ROLES.SUPER_ADMIN), updateClient);
router.delete('/:id', authorize(ROLES.SOCIO, ROLES.ADVOGADO, ROLES.SUPER_ADMIN), deleteClient);

export default router;
