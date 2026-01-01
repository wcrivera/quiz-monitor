// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import path from 'path';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { getStats, getQuizStatus } from '../controllers/quizController';
import { handleCaliperEvent, verifyCaliperEndpoint } from '../controllers/caliperController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Quiz Monitor Backend is running' });
});

// Caliper Analytics endpoints
router.post('/caliper', handleCaliperEvent);
router.get('/caliper', verifyCaliperEndpoint);

// LTI Routes
router.post('/lti/launch/:quizIds', validateLTILaunch, handleLaunch);
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// API Routes
router.get('/api/stats/:userId', getStats);
router.get('/api/quiz-status', getQuizStatus);

// Servir configuración XML
router.get('/config.xml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../public/caliper-config.xml'));
});

export default router;