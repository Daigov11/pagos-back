import { Router } from 'express';
import {
  asignarEquipoComision,
  catalogoEquiposComision,
  comisionesResumen,
  eliminarAsignacionEquipoComision,
  reclamarComision,
} from '../controllers/comisiones.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/resumen', requireAuth, comisionesResumen);
router.post('/reclamar', requireAuth, reclamarComision);
router.get('/equipos/catalogo', requireAuth, catalogoEquiposComision);
router.post('/equipos/:idOrdenServicio', requireAuth, asignarEquipoComision);
router.delete('/equipos/asignacion/:id', requireAuth, eliminarAsignacionEquipoComision);

export default router;
