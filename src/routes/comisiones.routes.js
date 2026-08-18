import { Router } from 'express';
import { comisionesResumen, reclamarComision } from '../controllers/comisiones.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/resumen', requireAuth, comisionesResumen);
router.post('/reclamar', requireAuth, reclamarComision);

export default router;
