// ============================================================================
// ROUTES
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { handleCanvasWebhook, verifyWebhook } from '../controllers/webhookController';
import { obtenerModuloCurso, obtenerModulosCurso } from '../controllers/modulo';
import { obtenerCurso } from '../controllers/curso';
import { obtenerBloquesModulo } from '../controllers/bloque';
import { enviarRespuestaQuiz, obtenerScoreQuiz, obtenerScoreQuizzes } from '../controllers/quiz';
import { obtenerQuestionsSection } from '../controllers/questions';
import { obtenerAyudantiasModulo } from '../controllers/ayudantia';
import { obtenerItemsCurso } from '../controllers/item';
import { obtenerUsuario } from '../controllers/usuario';
import { obtenerPaginasCurso } from '../controllers/pagina';

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

router.get('/api/quiz/obtener_scores/:curso_id/:user_id', obtenerScoreQuizzes)
router.get('/api/quiz/obtener/:curso_id/:quiz_id/:user_id', obtenerScoreQuiz)

router.post('/api/quiz/crear/:quiz_id', enviarRespuestaQuiz)
// API Routes
// router.get('/api/stats/:userId', getStats);
// router.get('/api/quiz-status', getQuizStatus);

// Obtener curso
// router.get('/api/curso/obtener/:cid', obtenerCurso);

// Obtener bloques de un módulo
router.get('/api/bloque/obtener/:cid/:mid', obtenerBloquesModulo);
// Obtener quizzes de un módulo

// Obtener questions de un quiz
router.get('/api/question/obtener/:cid/:sid', obtenerQuestionsSection);





// -----------------------------------------------------------
// -----------------------------------------------------------
// ROUTES PARA CURSO
// -----------------------------------------------------------
// -----------------------------------------------------------

// USUARIO ROUTES
router.get('/api/usuario/obtener/:course_id/:user_id', obtenerUsuario);
// CURSO ROUTES
router.get('/api/curso/obtener/:course_id', obtenerCurso);
// MODULOS ROUTES
router.get('/api/modulo/obtener/:course_id', obtenerModulosCurso);
router.get('/api/modulo/obtener/:course_id/:number', obtenerModuloCurso);
// ITEMS ROUTES
router.get('/api/item/obtener/:course_id', obtenerItemsCurso);
// PAGINAS ROUTES
router.get('/api/pagina/obtener/:course_id', obtenerPaginasCurso);
// AYUDANTIA ROUTES
router.get('/api/ayudantia/obtener/:course_id/:mid', obtenerAyudantiasModulo);
export default router;