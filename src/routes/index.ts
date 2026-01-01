// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { getStats, getQuizStatus } from '../controllers/quizController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Quiz Monitor Backend is running' });
});

// LTI Route con parámetro dinámico
// Acepta: /lti/launch/193158
//         /lti/launch/193158,193190
//         /lti/launch/193158,193190,193161
router.post('/lti/launch/:quizIds', validateLTILaunch, handleLaunch);

// Ruta fallback sin parámetro (usa .env)
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// API Routes
router.get('/api/stats/:userId', getStats);
router.get('/api/quiz-status', getQuizStatus);

export default router;