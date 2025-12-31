// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { 
  handleLaunchQuiz1, 
  handleLaunchQuiz2, 
  handleLaunchQuiz3,
  handleLaunchQuiz4
} from '../controllers/ltiController';
import { getStats, getQuizStatus } from '../controllers/quizController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Quiz Monitor Backend is running' });
});

// LTI Routes - Una ruta por cada conjunto de quizzes
router.post('/lti/launch/quiz1', validateLTILaunch, handleLaunchQuiz1);
router.post('/lti/launch/quiz2', validateLTILaunch, handleLaunchQuiz2);
router.post('/lti/launch/quiz3', validateLTILaunch, handleLaunchQuiz3);
router.post('/lti/launch/quiz4', validateLTILaunch, handleLaunchQuiz4);

// API Routes
router.get('/api/stats/:userId', getStats);
router.get('/api/quiz-status', getQuizStatus);

export default router;