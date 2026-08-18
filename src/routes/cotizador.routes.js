import { Router } from 'express';
import { catalogo, descargarPdf, documento, editarAlternativa, eliminar, generar, historial } from '../controllers/cotizador.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireChatIA } from '../middleware/requireChatIA.js';

const router = Router();

router.post('/generar', requireAuth, requireChatIA, generar);
router.get('/historial', requireAuth, requireChatIA, historial);
router.get('/catalogo', requireAuth, requireChatIA, catalogo);
router.get('/documento/:tipo/:numero', requireAuth, requireChatIA, documento);
router.put('/:id/alternativas/:indice', requireAuth, requireChatIA, editarAlternativa);
router.get('/:id/pdf', requireAuth, requireChatIA, descargarPdf);
router.delete('/:id', requireAuth, requireChatIA, eliminar);

export default router;
