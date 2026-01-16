// ============================================================================
// ROUTES - LTI CANVAS CONTENT VIEWER
// ============================================================================

import { Router } from 'express';
import { validateLTILaunch } from '../middleware/ltiAuth';
import { handleLaunch } from '../controllers/ltiController';
import { obtenerCurso } from '../controllers/curso';
import { obtenerUsuario } from '../controllers/usuario';
import { obtenerCapitulosCurso } from '../controllers/capitulo';
import { obtenerClasesCurso } from '../controllers/clase';
import { obtenerTemasCapitulo } from '../controllers/tema';
import { obtenerAyudantiasCapitulo } from '../controllers/ayudantia';
import { obtenerEjerciciosCapitulo } from '../controllers/ejercicio';

const router = Router();

// ============================================================================
// HEALTH CHECK
// ============================================================================
router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    message: 'LTI Canvas Content Viewer Backend is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// LTI ROUTES
// ============================================================================
router.post('/lti/launch', validateLTILaunch, handleLaunch);

// ============================================================================
// API ROUTES - CONTENT
// ============================================================================

// Usuario
router.get('/api/usuario/obtener/:curso_id/:user_id', obtenerUsuario);

// Curso
router.get('/api/curso/obtener/:curso_id', obtenerCurso);

// Capítulos
router.get('/api/capitulo/obtener/:curso_id', obtenerCapitulosCurso);

// Clases
router.get('/api/clase/obtener/:curso_id', obtenerClasesCurso);

// Temas
router.get('/api/tema/obtener/:capitulo_id', obtenerTemasCapitulo);

// Ayudantias
router.get('/api/ayudantia/obtener/:capitulo_id', obtenerAyudantiasCapitulo);

// Ejercicios
router.get('/api/ejercicio/obtener/:capitulo_id', obtenerEjerciciosCapitulo);

export default router;