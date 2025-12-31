// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { getStats, getQuizStatus } from '../controllers/quizController';
import { handleEmbed } from '../controllers/embedController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Quiz Monitor Backend is running' });
});

// Embed endpoint (sin validación LTI)
router.get('/embed', handleEmbed);

// LTI Routes
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// API Routes
router.get('/api/stats/:userId', getStats);
router.get('/api/quiz-status', getQuizStatus);

export default router;