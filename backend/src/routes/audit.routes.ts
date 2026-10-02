import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getAuditLogs } from '../controllers/audit.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('SOCIO', 'ADVOGADO'));

router.get('/', getAuditLogs);

export default router;
