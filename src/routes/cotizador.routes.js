import { Router } from 'express';
import { catalogo, descargarPdf, documento, editarAlternativa, eliminar, generar, historial } from '../controllers/cotizador.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/generar', requireAuth, generar);
router.get('/historial', requireAuth, historial);
router.get('/catalogo', requireAuth, catalogo);
router.get('/documento/:tipo/:numero', requireAuth, documento);
router.put('/:id/alternativas/:indice', requireAuth, editarAlternativa);
router.get('/:id/pdf', requireAuth, descargarPdf);
router.delete('/:id', requireAuth, eliminar);

export default router;
