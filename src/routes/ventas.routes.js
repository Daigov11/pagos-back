import { Router } from 'express';
import { ventasDelMes, ventasHistorial } from '../controllers/ventas.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/mes', requireAuth, ventasDelMes);
router.get('/historial', requireAuth, ventasHistorial);

export default router;
