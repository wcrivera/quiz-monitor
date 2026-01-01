// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { getStats, getQuizStatus } from '../controllers/quizController';
import { handleCanvasWebhook, verifyWebhook } from '../controllers/webhookController';

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
router.get('/api/stats/:userId', getStats);
router.get('/api/quiz-status', getQuizStatus);

export default router;