import { Router } from 'express';
import { listarReclamosAdmin, marcarReclamoPagado } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/reclamos', requireAuth, requireAdmin, listarReclamosAdmin);
router.patch('/reclamos/:id/pagar', requireAuth, requireAdmin, marcarReclamoPagado);

export default router;
