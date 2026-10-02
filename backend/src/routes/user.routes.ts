import { Router } from 'express';
import { Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getUsers, getUser, updateUser, deleteUser, uploadProfileImage } from '../controllers/user.controller';
import { profileUpload } from '../config/multer';
import { getUserPermissions } from '../utils/permissions';

const router = Router();
router.use(authenticate);

// Rota para retornar permissões do usuário logado
router.get('/me/permissions', (req: AuthRequest, res: Response) => {
  const permissions = getUserPermissions(req.user!.role);
  res.json({ status: 'success', data: { permissions } });
});

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.post('/:id/profile-image', profileUpload.single('profileImage'), uploadProfileImage);
router.delete('/:id', authorize('SUPER_ADMIN', 'SOCIO'), deleteUser);

export default router;
