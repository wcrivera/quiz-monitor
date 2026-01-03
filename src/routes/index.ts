// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { handleCanvasWebhook, verifyWebhook } from '../controllers/webhookController';
import { obtenerModuloCurso } from '../controllers/modulo';
import { obtenerCurso } from '../controllers/curso';
import { obtenerBloquesModulo } from '../controllers/bloque';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Quiz Monitor Backend is running' });
});

// Webhook endpoints
router.post('/webhooks/canvas', handleCanvasWebhook);
router.get('/webhooks/canvas', verifyWebhook);

// LTI Route con parámetro dinámico
router.post('/lti/launch/:quizIds', validateLTILaunch, handleLaunch);
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// API Routes
// router.get('/api/stats/:userId', getStats);
// router.get('/api/quiz-status', getQuizStatus);

// Obtener curso
router.get('/api/curso/obtener/:cid', obtenerCurso);
// Obtener módulos de un curso
router.get('/api/modulo/obtener/:cid/:number', obtenerModuloCurso);
// Obtener bloques de un módulo
router.get('/api/bloque/obtener/:cid/:mid', obtenerBloquesModulo);

export default router;